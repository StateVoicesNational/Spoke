/* eslint-disable no-param-reassign */
import { hasConfig, getConfig } from "../../../server/api/lib/config";
import { CIVICRM_CACHE_SECONDS } from "./const";
import { getCustomFields } from "./util";

// To make mocking easier, we place getCacheLength in its own file.

export function getCacheLength(nameActionOrLoader) {
  if (!hasConfig("CIVICRM_CACHE_LENGTHS")) {
    return CIVICRM_CACHE_SECONDS;
  }
  const cacheLengths = getCustomFields(getConfig("CIVICRM_CACHE_LENGTHS"));
  if (nameActionOrLoader in cacheLengths) {
    const nameActionOrLoaderParsed = Number(cacheLengths[nameActionOrLoader]);
    if (isNaN(nameActionOrLoaderParsed)) {
      return CIVICRM_CACHE_SECONDS;
    }
    return nameActionOrLoaderParsed;
  }
  return CIVICRM_CACHE_SECONDS;
}
