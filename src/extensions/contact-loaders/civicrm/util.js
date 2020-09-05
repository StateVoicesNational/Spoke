import civicrm from "civicrm";
import { parse } from "url";
import { getConfig } from "../../../server/api/lib/config";

const PAGE_SIZE = 100;

function getCivi() {
  const domain = parse(getConfig("CIVICRM_DOMAIN"));

  const config = {
    server: domain.protocol + "//" + domain.hostname,
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
        let values = result.values;
        delete result.values;
        // console.log(result);
        if (result.is_error) {
          reject(result.error_message);
        } else {
          resolve(values);
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
      return [];
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
  const key = "api.contact.get";

  let res = await paginate(
    get,
    "GroupContact",
    {
      debug: 1,
      sequential: 1,
      options: { limit: PAGE_SIZE },
      return: [],
      [key]: {
        return: ["phone", "postal_code", "first_name", "id", "last_name"],
        phone: { "IS NOT NULL": 1 }
      },
      [key + ".phone"]: { "IS NOT NULL": 1 },
      "group_id.id": groupId
    },
    limit
  );
  res = res.map(item => item[key].values);
  res = res.filter(item => !!item);
  console.log(res[0]);

  return res.filter(item => item.first_name && item.last_name && item.phone);
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
