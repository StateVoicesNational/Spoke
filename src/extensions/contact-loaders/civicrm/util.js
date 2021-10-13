import { parse } from "url";
import { getConfig } from "../../../server/api/lib/config";

const PAGE_SIZE = 100;

export const CUSTOM_DATA = [
  "middle_name",
  "individual_prefix",
  "gender",
  "city",
  "phone_id"
];

async function paginate(get, config, entity, options, callback) {
  let count = 0;

  while (true) {
    const once = await get(config, entity, options);

    if (!once.length) {
      return count;
    }
    await callback(once);

    count += once.length;

    options.options = options.options || {};
    options.options.offset = (options.options.offset || 0) + PAGE_SIZE;
  }
}

async function get(config, entity, params) {
  const url =
    config.server +
    config.path +
    "?key=" +
    config.key +
    "&api_key=" +
    config.api_key +
    "&entity=" +
    entity +
    "&action=get" +
    "&json=" +
    JSON.stringify(params);

  try {
    const result = await fetch(url);
    const json = await result.json();
    if (json.is_error) {
      return false;
    } else {
      return json.values;
    }
  } catch (error) {
    return error;
  }
}

function getCivi() {
  const civicrm = parse(getConfig("CIVICRM_API_URL"));

  const config = {
    server: civicrm.protocol + "//" + civicrm.host,
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

  const res = await get(config, "group", {
    sequential: 1,
    return: ["id", "title"],
    title: { LIKE: "%" + query + "%" },
    [key]: 1
  });

  return res.map(group => ({
    title: group.title + ` (${group[key]})`,
    count: group[key],
    id: group.id
  }));
}

export async function getGroupMembers(groupId, callback) {
  const config = getCivi();

  return await paginate(
    get,
    config,
    "Contact",
    {
      sequential: 1,
      options: { limit: PAGE_SIZE },
      first_name: { "IS NOT NULL": 1 },
      do_not_sms: { "=": 0 },
      is_deleted: { "=": 0 },
      is_deceased: { "=": 0 },
      is_opt_out: { "=": 0 },
      contact_type: "Individual",

      return: ["id", "first_name", "last_name", "postal_code", CUSTOM_DATA],

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
}
