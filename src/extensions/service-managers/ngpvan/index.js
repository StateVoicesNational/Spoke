import { getFeatures } from "../../../server/api/lib/config";
import { cacheableData } from "../../../server/models";

export const name = "ngpvan";

export const metadata = () => ({
  displayName: "NGPVAN Integration",
  description: "Used to set NGPVAN credentials per-organization",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: true,
  supportsCampaignConfig: false
});

export async function getOrganizationData({ organization, user, loaders }) {
  // MUST NOT RETURN SECRETS!
  const features = getFeatures(organization);
  const {
    NGP_VAN_API_KEY_ENCRYPTED,
    NGP_VAN_APP_NAME,
    NGP_VAN_DATABASE_MODE
  } = features;
  return {
    // data is any JSON-able data that you want to send.
    // This can/should map to the return value if you implement onOrganizationUpdateSignal()
    // which will then get updated data in the Settings component on-save
    data: {
      NGP_VAN_API_KEY_ENCRYPTED: NGP_VAN_API_KEY_ENCRYPTED && "<Encrypted>",
      NGP_VAN_APP_NAME,
      NGP_VAN_DATABASE_MODE: String(NGP_VAN_DATABASE_MODE)
    },
    // fullyConfigured: null means (more) configuration is optional -- maybe not required to be enabled
    // fullyConfigured: true means it is fully enabled and configured for operation
    // fullyConfigured: false means more configuration is REQUIRED (i.e. manager is necessary and needs more configuration for Spoke campaigns to run)
    fullyConfigured: null
  };
}

export async function onOrganizationUpdateSignal({
  organization,
  user,
  updateData
}) {
  const updatedFeatures = await cacheableData.organization.setFeatures(
    organization.id,
    updateData
  );
  const {
    NGP_VAN_API_KEY_ENCRYPTED,
    NGP_VAN_APP_NAME,
    NGP_VAN_DATABASE_MODE
  } = updatedFeatures;
  return {
    data: {
      NGP_VAN_API_KEY_ENCRYPTED: NGP_VAN_API_KEY_ENCRYPTED && "<Encrypted>",
      NGP_VAN_APP_NAME,
      NGP_VAN_DATABASE_MODE: String(NGP_VAN_DATABASE_MODE)
    },
    fullyConfigured: true
  };
}