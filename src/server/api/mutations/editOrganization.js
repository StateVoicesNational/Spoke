import { getConfig, getFeatures } from "../lib/config";
import { accessRequired } from "../errors";
import { r, cacheableData } from "../../models";

export const editOrganization = async (
  _,
  { id, organization },
  { loaders, user }
) => {
  await accessRequired(user, id, "OWNER", true);
  const orgRecord = cacheableData.organization.load(id);
  const features = getFeatures(orgRecord);
  const changes = {};

  if (organization.texterUIConfig) {
    // update texterUIConfig
    features.TEXTER_UI_SETTINGS = organization.texterUIConfig.options;
    changes["features"] = features;
  }

  if (Object.keys(changes).length) {
    if (changes.features) {
      changes.features = JSON.stringify(changes.features);
    }
    await r
      .knex("organization")
      .where("id", id)
      .update(changes);
  }

  await cacheableData.organization.clear(id);
  return loaders.organization.load(id);
};

export default editOrganization;
