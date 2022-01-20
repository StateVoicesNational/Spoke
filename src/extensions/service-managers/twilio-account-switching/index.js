import { accessRequired } from "../../../server/api/errors";
import { getFeatures } from "../../../server/api/lib/config";
import { cacheableData, r } from "../../../server/models";
import { getSecret, convertSecret } from "../../secret-manager";

export const name = "twilio-account-switching";

export const metadata = () => ({
  displayName: "Twilio Accounts",
  description: "Add, delete, and edit Twilio accounts",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign
}) {
  const campaignTwilioAccount = _getCampaignTwilioAccount(
    campaign,
    ({ accountSid, authToken, id, messageServiceSids }) => ({
      accountSid,
      authToken,
      id,
      messageServiceSids
    }),
    organization
  );

  if (Number.isInteger(campaignTwilioAccount.id)) {
    // Split message service SIDs into array
    const messageServiceSids = campaignTwilioAccount.messageServiceSids
      .replace(/\s/g, "")
      .split(",");

    return {
      twilioAccountSwitching: {
        twilioAccountSwitchingCreds: {
          accountSid: campaignTwilioAccount.accountSid,
          authToken: await getSecret(
            `MULTI_TWILIO_AUTH_${campaignTwilioAccount.id}`,
            campaignTwilioAccount.authToken,
            organization
          )
        }
      },
      messageservice_sid:
        messageServiceSids[
          Math.floor(Math.random() * messageServiceSids.length)
        ] // Get random message service SId
    };
  }
}

export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  // MUST NOT RETURN SECRETS!
  // called both from edit and stats contexts: editMode==true for edit page
  if (!fromCampaignStatsPage) {
    const campaignTwilioAccount = _getCampaignTwilioAccount(
      campaign,
      ({ friendlyName, id }) => ({ friendlyName, id }),
      organization
    );

    return {
      data: {
        campaignTwilioAccount: campaignTwilioAccount,
        multiTwilio: _getCampaignAccounts(organization)
      },
      fullyConfigured: Number.isInteger(campaignTwilioAccount.id) ? true : false
    };
  }
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  updateData
}) {
  await cacheableData.campaign.setFeatures(campaign.id, {
    multiTwilioId: updateData
  });

  return {
    data: {
      multiTwilio: _getCampaignAccounts(organization)
    },
    fullyConfigured: true,
    unArchiveable: false
  };
}

export async function getOrganizationData({ organization }) {
  const accounts = getFeatures(organization).MULTI_TWILIO;

  return {
    data: {
      multiTwilio: accounts ? _obscureSensitiveInformation(accounts) : []
    },
    fullyConfigured: null
  };
}

export async function onOrganizationUpdateSignal({
  organization,
  user,
  updateData
}) {
  let orgChanges = {
    features: getFeatures(organization)
  };
  const orgFeatures = getFeatures(organization).MULTI_TWILIO || [];

  for (let i = 0; i < updateData.length; i++) {
    const curAccount = updateData[i];
    const foundAccount = orgFeatures
      ? orgFeatures.find(account => account.id == curAccount.id)
      : null;

    // Only encrypt auth token if it's not already encrypted
    if (curAccount.authToken == "<Encrypted>") {
      // Didn't change auth token. Don't re-encrypt
      curAccount.authToken = foundAccount.authToken;
    } else {
      // New account or updated auth token
      curAccount.authToken = await convertSecret(
        "MULTI_TWILIO_AUTH_" + curAccount.id,
        organization,
        curAccount.authToken
      );
    }
  }
  orgChanges.features.MULTI_TWILIO = updateData;

  // Make DB changes
  await cacheableData.organization.clear(organization.id);
  await r
    .knex("organization")
    .where("id", organization.id)
    .update(orgChanges);

  return {
    data: {
      multiTwilio: _obscureSensitiveInformation(
        orgChanges.features.MULTI_TWILIO
      )
    },
    fullyConfigured: true
  };
}

/**
 * @param {Object} organization
 * @returns Array of Twilio account friendlyId and id subsets
 */
function _getCampaignAccounts(organization) {
  const accounts = getFeatures(organization).MULTI_TWILIO;

  return accounts
    ? accounts.map(account => {
        return (({ friendlyName, id }) => ({ friendlyName, id }))(account);
      })
    : [];
}

/**
 * @param {Object} campaign
 * @param {function} keys Defines keys to return in account obj
 * @param {Object} organization
 * @returns Twilio account currently select for the campaign
 */
function _getCampaignTwilioAccount(campaign, keys, organization) {
  let campaignTwilioAccount;
  const multiTwilioId = getFeatures(campaign).multiTwilioId;

  if (multiTwilioId) {
    const account = getFeatures(organization).MULTI_TWILIO.find(
      account => account.id == multiTwilioId
    );

    campaignTwilioAccount = account ? keys(account) : {};
  } else {
    campaignTwilioAccount = {};
  }

  return campaignTwilioAccount;
}

/**
 * @param {Array} accounts
 * @returns Obscured auth tokens
 */
function _obscureSensitiveInformation(accounts) {
  return JSON.parse(JSON.stringify(accounts)).map(account => {
    account.authToken = "<Encrypted>";
    return account;
  });
}
