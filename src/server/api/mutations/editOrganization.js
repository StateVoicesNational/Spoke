import { getConfig, getFeatures } from "../lib/config";
import { accessRequired } from "../errors";
import { r, cacheableData } from "../../models";
import { getAllowed } from "../organization";

export const editOrganization = async (_, { id, organization }, { user }) => {
  await accessRequired(user, id, "ADMIN", true);
  const orgRecord = await cacheableData.organization.load(id);
  const features = getFeatures(orgRecord);
  const changes = {};

  if (organization.texterUIConfig) {
    // update texterUIConfig
    features.TEXTER_UI_SETTINGS = organization.texterUIConfig.options;
    changes["features"] = features;
  }

  if (organization.settings) {
    const { unsetFeatures, featuresJSON } = organization.settings;
    const newFeatureValues = JSON.parse(featuresJSON);
    getAllowed(orgRecord, user).forEach(f => {
      if (
        newFeatureValues.hasOwnProperty(f) &&
        // don't save default values that aren't already overridden
        (features.hasOwnProperty(f) || getConfig(f) != newFeatureValues[f])
      ) {
        features[f] = newFeatureValues[f];
      }
    });
    unsetFeatures.forEach(f => {
      delete features[f];
    });
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
  return await cacheableData.organization.load(id);
};
