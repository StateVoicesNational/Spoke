/* eslint-disable no-unused-vars */
import fetch, { Headers } from "node-fetch";
import { getConfig } from "../../../server/api/lib/config";
import { getFormattedPhoneNumber } from "../../../lib";
import {} from "./js-doc-types";
import { decamelizeKeys } from "humps";
import { GVIRS_VOTERS_FIELDS, GVIRS_CUSTOM_VOTERS_FIELDS } from "./const";
import { log } from "../../../lib/log";

/* This reads the value of GVIRS_CONNECTIONS and decomposes it into:
// {
//   org1_prefix: {
//    domain: domain for gVIRS instance for org1,
//    xapikey: X-Api-Key for gVIRS instance,
//    xappid: X-App-Id for gVIRS instance,
//  },
//   org2_prefix: {
//    domain: domain for gVIRS instance for org2,
//    xapikey: X-Api-Key for gVIRS instance,
//    xappid: X-App-Id for gVIRS instance,
//  },
//  ...
//   orgn_prefix: {
//    domain: domain for gVIRS instance for orgn,
//    xapikey: X-Api-Key for gVIRS instance,
//    xappid: X-App-Id for gVIRS instance,
//  },
// }
//
// Where a value for GVIRS_CONNECTIONS is probably going to be:
//
// orgn_prefix,orgn_domain,orgn_X-Api-Key,orgn_X-App-Id;...
//
// Basically, a line of four comma separated variables, each
// separated by semicolons.
*/

export function decomposeGVIRSConnections(customDataEnv) {
  const prefixesAndValues = {};

  if (customDataEnv) {
    const scsvParts = customDataEnv.split(";");
    for (const scsvPart of scsvParts) {
      const commaParts = scsvPart.split(",");
      if (commaParts.length < 4) {
        return {};
      }
      const prefixName = commaParts[0];
      prefixesAndValues[prefixName] = {
        domain: commaParts[1],
        xapikey: commaParts[2],
        xappid: commaParts[3]
      };
    }
  }
  return prefixesAndValues;
}

export function getGVIRSCustomFields(customDataEnv) {
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

// Example:
// https://localdev1.gvirs.com/api/v3/entity_action?entity_class=voter&action=count_total&load_type=extended_flat

class GvirsApiError extends Error {
  constructor(message, status, gvirsName) {
    super(`GvirsApiError [status=${status}, name=${gvirsName}]: ${message}`);
    this.gvirsName = gvirsName;
    this.status = status;
  }
}

/**
 * Make a GET request to gVIRS APIv3, retrieving information about entities.
 *
 * @param   {GvirsApiConnectionData}  connData  - Must be specific to
 * organisation.
 *
 * @param   {'voter_segment'|'voter_for_spoke'|'phone_filter'}  entity - The
 * entity. Others are technically available depending on permissions for the
 * app, but not relevant here.
 *
 * @param   {'load'|'search'}  action - Other actions are technically available,
 * depending on permissions for the app, but are not relevant.
 *
 * @param   {'single_table'|'extended_flat'}  loadType - single_table is faster
 * with less information, extended_flat is slower and richer, but also supported
 * select_fields.
 *
 * @param   {GvirsApiQuery}  entityQuery - For search, a searchTree must be
 * provided. For load an id
 *
 * @param   {GvirsApiParams}  params - Adjusts how the query is performed
 *
 * @param   {object}  fetchOptions - Additional options to pass to fetch()
 *
 * @return  {Promise<GvirsApiSuccessfulResult>} - If successful, will resolve
 * into the data with entities if search action, entity if load action. On
 * failure will reject with an GvirsApiError containing information
 */
export async function gvirsApi3Get(
  connData,
  entity,
  action,
  loadType,
  entityQuery,
  params = {},
  fetchOptions = {}
) {
  let url = `${connData.domain}/api/v3/entity_action?`;
  url += `entity_class=${entity}`;
  url += `&action=${action}`;
  url += `&load_type=${loadType}`;

  if ("id" in entityQuery) {
    url += `&id=${entityQuery.id}`;
  }

  if ("searchTree" in entityQuery) {
    // The tree will already have its bits in snake case
    url += `&search_tree=${encodeURI(JSON.stringify(entityQuery.searchTree))}`;
  }

  if (Object.keys(params).length > 0) {
    const paramsSnake = decamelizeKeys(params);
    url += `&params=${encodeURI(JSON.stringify(paramsSnake))}`;
  }

  const headers = new Headers();
  headers.append("X-Api-Key", connData.apiKey);
  headers.append("X-App-Id", connData.appId);
  try {
    const result = await fetch(url, { ...fetchOptions, headers });
    const json = await result.json();
    // fetch's Response resolves even if request was non in 200-299 range, but
    // it will set ok to false
    if (result.ok) {
      return json;
    }

    const errData = json.error;
    if (errData) {
      throw new GvirsApiError(
        errData.message,
        errData.status || result.status,
        errData.name
      );
    } else {
      throw new Error("API error with no detail!");
    }
  } catch (err) {
    throw err;
  }
}

export async function fetchfromGvirs(
  base,
  entity,
  action,
  load,
  xapikey,
  xappid,
  searchTree = "",
  params = "",
  id = 0,
  fetchOptions = {}
) {
  let url = `${base}/api/v3/entity_action?entity_class=${entity}&action=${action}&load_type=${load}`;
  if (searchTree) {
    url += `&search_tree=${encodeURI(searchTree)}`;
  }
  if (params) {
    url += `&params=${encodeURI(params)}`;
  }
  if (id) {
    url += `&id=${id}`;
  }
  const headers = new Headers();
  headers.append("X-Api-Key", xapikey);
  headers.append("X-App-Id", xappid);
  try {
    const result = await fetch(url, { ...fetchOptions, headers });
    const json = await result.json();
    return json;
  } catch (error) {
    return null;
  }
}

// This gets all segments for an organisation name

export async function searchSegments(query, organizationName) {
  if (!organizationName) {
    return [];
  }
  const connectionData = decomposeGVIRSConnections(
    getConfig("GVIRS_CONNECTIONS")
  );
  if (!(organizationName in connectionData)) {
    return [];
  }
  const { domain, xapikey, xappid } = connectionData[organizationName];
  const searchTreeObj = `{"node_type": "comparison", "field": "name", "operator": "ilike", "value": "%${query}%"}`;

  const gVIRSData = await fetchfromGvirs(
    domain,
    "voter_segment",
    "search",
    "extended_flat",
    xapikey,
    xappid,
    searchTreeObj,
    '{"select_fields":["id","name","num_voters"]}'
  );
  if (gVIRSData) {
    return gVIRSData.entities.map(segment => ({
      title: `${segment.name} (${segment.num_voters})`,
      count: segment.num_voters,
      id: segment.id
    }));
  }
  return [];
}

// This gets the contacts for a segment, given by an id (and organization name).

export async function getSegmentVoters(
  segmentId,
  campaignId,
  organizationName
) {
  if (!organizationName) {
    return [];
  }
  const connectionData = decomposeGVIRSConnections(
    getConfig("GVIRS_CONNECTIONS")
  );
  if (!(organizationName in connectionData)) {
    return [];
  }
  const { domain, xapikey, xappid } = connectionData[organizationName];

  const voterSearchTree = {
    node_type: "comparison",
    field: "_in_voter_segment_id",
    operator: "=",
    value: segmentId
  };

  try {
    const segmentInformation = await gvirsApi3Get(
      { domain, appId: xappid, apiKey: xapikey },
      "voter_segment",
      "load",
      "single_table",
      { id: segmentId }
    );

    const phoneFilterId = segmentInformation.entity.phone_filter_id || null;
    let phoneFilterTree = {};
    if (phoneFilterId === null) {
      const phoneFilter = await gvirsApi3Get(
        { domain, appId: xappid, apiKey: xapikey },
        "phone_filter",
        "load",
        "single_table",
        { id: phoneFilterId }
      );
      const phoneFilterTreeJson = phoneFilter.entity.filter_tree || "{}";
      phoneFilterTree = JSON.parse(phoneFilterTreeJson);
    }

    const gVIRSVoterData = await gvirsApi3Get(
      { domain, appId: xappid, apiKey: xapikey },
      "voter_for_spoke",
      "search",
      "extended_flat",
      { searchTree: voterSearchTree },
      {
        selectFields: GVIRS_VOTERS_FIELDS,
        fromAliasSearchTrees: {
          voterMobileLatest: phoneFilterTree
        }
      }
    );

    const customFields = getGVIRSCustomFields(getConfig("GVIRS_CUSTOM_DATA"));
    const customFieldNames = Object.keys(customFields);
    return gVIRSVoterData.entities
      .filter(res => res.mobile_latest_phone_number)
      .map(res => {
        const customFieldOutput = {};
        for (const customFieldName of customFieldNames) {
          if (customFieldName in res) {
            customFieldOutput[customFields[customFieldName]] =
              res[customFieldName] || "";
          }
        }
        const remainderCustomFields = GVIRS_CUSTOM_VOTERS_FIELDS.filter(
          x => customFieldNames.indexOf(x) === -1
        );
        for (const customFieldName of remainderCustomFields) {
          if (customFieldName in res) {
            customFieldOutput[customFieldName] = res[customFieldName] || "";
          }
        }

        return {
          first_name: res.first_name,
          last_name: res.surname,
          cell: getFormattedPhoneNumber(
            res.mobile_latest_phone_number,
            getConfig("PHONE_NUMBER_COUNTRY")
          ),
          zip: res.postal_code,
          external_id: res.id,
          custom_fields: JSON.stringify(customFieldOutput),
          message_status: "needsMessage",
          campaign_id: campaignId
        };
      })
      .filter(res => res.cell !== ""); // Yes: still necessary as well.
  } catch (err) {
    log.error(err);
    return [];
  }
}
