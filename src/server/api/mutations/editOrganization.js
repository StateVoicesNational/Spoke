import { getConfig, getFeatures } from "../lib/config";
import { accessRequired } from "../errors";
import { r, cacheableData } from "../../models";
import { getAllowed } from "../organization";
// import ExtensionSettings from "../../../components/ExtensionSettings";

export const editOrganization = async (_, { id, organization }, { user }) => {
  await accessRequired(user, id, "OWNER", true);
  const orgRecord = await cacheableData.organization.load(id);
  const features = getFeatures(orgRecord);
  const changes = {};

  if (organization.texterUIConfig) {
    // update texterUIConfig
    features.TEXTER_UI_SETTINGS = organization.texterUIConfig.options;
  }

  if (organization.defaultSettings) {
    const { unsetFeatures, featuresJSON } = organization.defaultSettings;
    const newFeatureValues = JSON.parse(featuresJSON);
    getAllowed(orgRecord, user).forEach(f => {
      // don't save default values that aren't already overridden
      if (newFeatureValues.hasOwnProperty(f) && !unsetFeatures.includes(f)) {
        features.DEFAULT_SETTINGS[f] = newFeatureValues[f];
      }
    });
  }

  if (organization.extensionSettings) {
    const updatedExtensionSettings = {
      MESSAGE_HANDLERS: organization.extensionSettings.savedMessageHandlers.join(),
      ACTION_HANDLERS: organization.extensionSettings.savedActionHandlers.join(),
      CONTACT_LOADERS: organization.extensionSettings.savedContactLoaders.join()
    };
    features.EXTENSION_SETTINGS = updatedExtensionSettings;
  }

  changes.features = features;

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
