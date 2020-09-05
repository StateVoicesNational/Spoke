import civicrm from "civicrm";
import { parse } from "url";
import { getConfig } from "../../../server/api/lib/config";

const PAGE_SIZE = 100;

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

  return promisify(crmAPI.get.bind(crmAPI));
}

function promisify(func) {
  return async function() {
    const args = Array.prototype.slice.call(arguments);

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

async function paginate(get, entity, options, limit) {
  limit = limit || Infinity;

  let res = [];

  while (true) {
    const once = await get(entity, options);
    if (!once.length) {
      return res;
    }

    res = res.concat(once);
    if (res.length > limit) return res;

    options.options = options.options || {};

    options.options.offset = (options.options.offset || 0) + PAGE_SIZE;
  }
}

export async function searchGroups(query) {
  const get = getCivi();
  const key = "api.GroupContact.getcount";

  const res = await get("group", {
    return: ["id", "title"],
    title: { LIKE: "%" + query + "%" },
    [key]: 1
  });

  return res.map(group => {
    group.title += ` (${group[key]})`;
    delete group[key];
    return group;
  });
}

export async function getGroupMembers(groupId, limit) {
  const get = getCivi();

  return await paginate(
    get,
    "Contact",
    {
      debug: 1,
      sequential: 1,
      options: { limit: PAGE_SIZE },
      phone: { "IS NOT NULL": 1 },
      return: ["id", "phone", "first_name", "last_name", "postal_code"],
      "filter.group_id": parseInt(groupId)
    },
    limit
  );
}

async function main() {
  for (const group of await searchGroups(" wa")) {
    const members = await getGroupMembers(group.id, 10);
    if (members.length) {
      console.log(group.title, members.length);
      break;
    } else {
      console.log("tick");
    }
  }
}

// debugger;
// main();
