import civicrm from "civicrm";
import { parse } from "url";
import { getConfig } from "../../../server/api/lib/config";

const PAGE_SIZE = 100;
export const CUSTOM_DATA = [
  "middle_name",
  "individual_prefix",
  "gender",
  "city"
];

function getCivi() {
  const domain = parse(getConfig("CIVICRM_DOMAIN"));

  const config = {
    server: domain.protocol + "//" + domain.host,
    path: domain.pathname,
    debug: 1,
    key: getConfig("CIVICRM_SITE_KEY"),
    api_key: getConfig("CIVICRM_API_KEY")
  };

  const crmAPI = civicrm(config);

  return {
    get: promisify(crmAPI.get.bind(crmAPI)),
    create: promisify(crmAPI.create.bind(crmAPI))
  };
}

function promisify(func) {
  return async function(...args) {
    return new Promise((resolve, reject) => {
      args.push(result => {
        if (result.is_error) {
          reject(result.error_message);
        } else {
          resolve(result.values);
        }
      });

      func(...args);
    });
  };
}

async function paginate(get, entity, options, callback) {
  let count = 0;

  while (true) {
    const once = await get(entity, options);
    if (!once.length) {
      return count;
    }
    await callback(once);

    count += once.length;

    options.options = options.options || {};

    options.options.offset = (options.options.offset || 0) + PAGE_SIZE;
  }
}

/**
 * @param {string} query
 * @returns {Promise<{ title: string; count: number; id: number }[]>}
 */
export async function searchGroups(query) {
  const { get } = getCivi();
  const key = "api.GroupContact.getcount";

  const res = await get("group", {
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
  const { get } = getCivi();

  return await paginate(
    get,
    "Contact",
    {
      debug: 1,
      sequential: 1,
      options: { limit: PAGE_SIZE },
      phone: { "IS NOT NULL": 1 },

      // filter out people who probably don't want to be contacted
      do_not_sms: { "=": 0 },
      contact_is_deleted: { "=": 0 },
      is_deceased: { "=": 0 },
      is_opt_out: { "=": 0 },

      return: [
        "id",
        "phone",
        "first_name",
        "last_name",
        "postal_code",

        // additional data
        ...CUSTOM_DATA
      ],

      // Closest thing to docs for this: https://lab.civicrm.org/dev/core/blob/d434a5cfb2dc3c248ac3c0d8570bd8e9d828f6ad/api/v3/Contact.php#L403
      group: groupId
    },
    callback
  );
}
