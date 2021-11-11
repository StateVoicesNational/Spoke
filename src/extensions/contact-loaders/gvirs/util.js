/* eslint-disable no-unused-vars */
import fetch, { Headers } from "node-fetch";

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

export async function searchSegments(segments, value) {
  return segments;
}

// Example:
// https://localdev1.gvirs.com/api/v3/entity_action?entity_class=voter&action=count_total&load_type=extended_flat

export async function fetchfromGvirs(
  base,
  entity,
  action,
  load,
  xapikey,
  xappid,
  fetchOptions = {}
) {
  const url = `${base}/api/v3/entity_action?entity_class=${entity}&action=${action}&load_type=${load}`;
  const headers = new Headers();
  headers.append("X-Api-Key", xapikey);
  headers.append("X-App-Id", xappid);
  try {
    const result = await fetch(url, { ...fetchOptions, headers });
    const json = await result.json();
    return json;
  } catch (error) {
    return error;
  }
}
