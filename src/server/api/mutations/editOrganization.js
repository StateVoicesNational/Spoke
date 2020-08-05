import { getFeatures } from "../lib/config";
import { accessRequired } from "../errors";
import { r, cacheableData } from "../../models";
import { getAllowed } from "../organization";

export const editOrganization = async (_, { id, organization }, { user }) => {
  await accessRequired(user, id, "OWNER", true);
  const orgRecord = await cacheableData.organization.load(id);
  const features = getFeatures(orgRecord);
  const changes = {};

  if (organization.texterUIConfig) {
    // update texterUIConfig
    features.TEXTER_UI_SETTINGS = organization.texterUIConfig.options;
    changes["features"] = features;
  }

  console.log("editOrg settings: ", organization.settings);
  if (organization.settings) {
    const { unsetFeatures, featuresJSON } = organization.settings;
    console.log("editOrg featuresJson: ", featuresJSON);

    const newFeatureValues = JSON.parse(featuresJSON);
    console.log("editOrg newFeatures: ", newFeatureValues);
    getAllowed(orgRecord, user).forEach(f => {
      if (newFeatureValues.hasOwnProperty(f)) {
        features[f] = newFeatureValues[f];
      }
    });
    console.log("editOrg features first: ", features);

    unsetFeatures.forEach(f => {
      delete features[f];
    });
    console.log("editOrg features then: ", features);
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
