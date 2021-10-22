/* eslint-disable no-param-reassign */
import { getConfig } from "../../../server/api/lib/config";
import fetch from "node-fetch";
import { log } from "../../../lib/log";
import moment from "moment-timezone";

const PAGE_SIZE = 100;

const DEFAULT_CONTACT_ENTITY_METHOD_NAME = "Contact";

export function getCustomFields(customDataEnv) {
  const pairsFieldAndLabel = {};

  if (customDataEnv) {
    const csvParts = customDataEnv.split(",");
    for (const csvPart of csvParts) {
      const colonParts = csvPart.split(":");
      const fieldName = colonParts[0];
      if (colonParts.length === 1) {
        pairsFieldAndLabel[fieldName] = fieldName;
      } else {
        pairsFieldAndLabel[fieldName] = colonParts[1];
      }
    }
  }
  return pairsFieldAndLabel;
}

export const CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT =
  "/integration/civicrm/groupsearch";
export const CIVICRM_MINQUERY_SIZE = 3;

async function paginate(fetchfromAPIMethod, config, entity, options, callback) {
  let count = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const once = await fetchfromAPIMethod(config, entity, options);

    if (!once.length) {
      return count;
    }
    await callback(once);

    count += once.length;

    options.options = options.options || {};
    options.options.offset = (options.options.offset || 0) + PAGE_SIZE;
  }
}

async function fetchfromAPI(
  config,
  entity,
  params,
  entityAction = "get",
  fetchOptions = {}
) {
  const jsonParams = encodeURIComponent(JSON.stringify(params));
  const url = `${config.server}${config.path}?key=${config.key}&api_key=${config.api_key}&entity=${entity}&action=${entityAction}&json=${jsonParams}`;
  try {
    const result = await fetch(url, fetchOptions);
    const json = await result.json();
    return json.is_error ? false : json.values;
  } catch (error) {
    return error;
  }
}

function getCivi() {
  const civicrm = new URL(getConfig("CIVICRM_API_URL"));

  const config = {
    server: `${civicrm.protocol}//${civicrm.host}`,
    path: civicrm.pathname,
    debug: 1,
    key: getConfig("CIVICRM_SITE_KEY"),
    api_key: getConfig("CIVICRM_API_KEY")
  };

  return config;
}

/**
 * @param {string} query
 * @returns {Promise<{ title: string; count: number; id: number }[]>}
 */
export async function searchGroups(query) {
  const config = getCivi();

  const key = "api.GroupContact.getcount";

  const res = await fetchfromAPI(config, "group", {
    sequential: 1,
    return: ["id", "title"],
    title: { LIKE: `%${query}%` },
    [key]: 1,
    options: { limit: 0 }
  });
  if (res) {
    return res.map(group => ({
      title: `${group.title} (${group[key]})`,
      count: group[key],
      id: group.id
    }));
  }
  return [];
}

export async function getGroupMembers(groupId, callback) {
  const config = getCivi();

  const contactEntityMethodName =
    getConfig("CIVICRM_CUSTOM_METHOD") || DEFAULT_CONTACT_ENTITY_METHOD_NAME;

  const customFields = getCustomFields(getConfig("CIVICRM_CUSTOM_DATA"));
  const customFieldNames = Object.keys(customFields);

  const paginatedData = await paginate(
    fetchfromAPI,
    config,
    contactEntityMethodName,
    {
      sequential: 1,
      options: { limit: PAGE_SIZE },
      first_name: { "IS NOT NULL": 1 },
      do_not_sms: { "=": 0 },
      is_deleted: { "=": 0 },
      is_deceased: { "=": 0 },
      is_opt_out: { "=": 0 },
      contact_type: "Individual",

      return: [
        "id",
        "first_name",
        "last_name",
        "postal_code",
        ...customFieldNames
      ],

      "api.Phone.get": {
        contact_id: "$value.id",
        phone_type_id: "Mobile",

        return: ["id", "phone_numeric"],
        options: { limit: 1 }
      },
      // Closest thing to docs for this: https://lab.civicrm.org/dev/core/blob/d434a5cfb2dc3c248ac3c0d8570bd8e9d828f6ad/api/v3/Contact.php#L403
      group: groupId
    },
    callback
  );
  return paginatedData;
}

export async function addContactToGroup(contactId, groupId) {
  const config = getCivi();

  const res = await fetchfromAPI(
    config,
    "GroupContact",
    {
      contact_id: contactId,
      group_id: groupId
    },
    "create",
    { method: "post" }
  );
  log.debug(res);
  return res;
}

export async function sendEmailToContact(contactId, templateId) {
  const config = getCivi();

  const res = await fetchfromAPI(
    config,
    "Email",
    {
      contact_id: contactId,
      template_id: templateId
    },
    "send",
    { method: "post" }
  );
  log.debug(res);
  return res;
}

export async function addContactToTag(contactId, tagId) {
  const config = getCivi();

  const res = await fetchfromAPI(
    config,
    "EntityTag",
    {
      entity_id: contactId,
      entity_table: "civicrm_contact",
      tag_id: tagId
    },
    "create",
    { method: "post" }
  );
  log.debug(res);
  return res;
}

/**
 * @returns {Promise<{ name: string; id: number }[]>}
 */
export async function searchTags() {
  const config = getCivi();

  const res = await fetchfromAPI(config, "tag", {
    sequential: 1,
    return: ["id", "name"],
    options: { limit: 0 }
  });
  if (res) {
    return res;
  }
  return [];
}

/**
 * @returns {Promise<{ name: string; id: number }[]>}
 */
export async function searchEvents() {
  const config = getCivi();
  const currentNow = moment()
    .tz(getConfig("CIVICRM_SERVER_TIMEZONE"))
    .format("YYYY-MM-DD HH:mm:ss");
  const res = await fetchfromAPI(config, "event", {
    sequential: 1,
    return: ["id", "title"],
    title: { "!=": "" },
    is_monetary: 0,
    requires_approval: 0,
    start_date: {
      ">": currentNow
    },
    options: { limit: 0 }
  });
  if (res) {
    return res;
  }
  return [];
}

export async function registerContactForEvent(contactId, eventId) {
  const config = getCivi();

  const res = await fetchfromAPI(
    config,
    "Participant",
    {
      contact_id: contactId,
      event_id: eventId
    },
    "create",
    { method: "post" }
  );
  log.debug(res);
  return res;
}
