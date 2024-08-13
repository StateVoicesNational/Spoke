// legacy env vars: CONTACTS_PER_PHONE_NUMBER, EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE
// per-campaign-messageservice
// Implements:
// - onMessageSend: to update/change the message.messageservice_sid
// - onCampaignStart: to create the message service and allocate numbers to it
// - getCampaignData: provide the react component to allocate numbers
// - onCampaignUpdateSignal: to remove and deallocate the message service after archive
// - onOrganizationServiceVendorSetup: to disable requiring org-level messageservice setup
// - onVendorServiceFullyConfigured: to disable requiring org-level messageservice setup

// TODO: how should AdminPhoneNumberBuying be affected -- can/should it 'steal' the message
// TODO: maybe it should remove/block the org-level messageservice_sid from being set? (or warn in org config)
// TODO/FUTURE: org config for: manualMessageServiceMode and CAMPAIGN_PHONES_RETAIN_MESSAGING_SERVICES

import { r, cacheableData } from "../../../server/models";
import ownedPhoneNumber from "../../../server/api/lib/owned-phone-number";
import { accessRequired } from "../../../server/api/errors";
import { getConfig } from "../../../server/api/lib/config";
import { getServiceNameFromOrganization } from "../../service-vendors";
import * as twilio from "../../service-vendors/twilio";
import { camelizeKeys } from "humps";
import usAreaCodes from "us-area-codes/data/codes.json";

export const name = "per-campaign-messageservices";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Per-campaign Message Service",
  description:
    "Twilio has a cap of 250 numbers per-message service. This manages new message-services per-campaign so that the total numbers used (and thus contacts) can be multiplied by a number of simultaneous campaigns.",
  canSpendMoney: true,
  moneySpendingOperations: ["onCampaignStart"],
  supportsOrgConfig: false,
  supportsCampaignConfig: true
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign
}) {
  if (campaign && campaign.messageservice_sid) {
    return {
      messageservice_sid: campaign.messageservice_sid
    };
  }
}

const _contactsPerPhoneNumber = organization => ({
  contactsPerPhoneNumber: Number(
    getConfig("CONTACTS_PER_PHONE_NUMBER", organization) || 200
  )
});

const _editCampaignData = async (organization, campaign) => {
  // 1. inventoryPhoneNumberCounts (for a campaign)
  const counts = await ownedPhoneNumber.listCampaignNumbers(campaign.id);
  const inventoryPhoneNumberCounts = camelizeKeys(counts);
  // 2. contactsAreaCodeCounts
  const areaCodes = await r
    .knex("campaign_contact")
    .select(
      r.knex.raw(`
          substring(cell, 3, 3) AS area_code,
          count(*)
        `)
    )
    .where({ campaign_id: campaign.id })
    .groupBy(1);

  const contactsAreaCodeCounts = areaCodes.map(data => ({
    areaCode: data.area_code,
    state: usAreaCodes[data.area_code] || "N/A",
    count: parseInt(data.count, 10)
  }));
  // 2. phoneNumberCounts (for organization)
  const phoneNumberCounts = await ownedPhoneNumber.listOrganizationCounts(
    organization
  );
  // 3. fullyConfigured
  const contactsCount =
    campaign.contactsCount ||
    (await r.getCount(
      r.knex("campaign_contact").where("campaign_id", campaign.id)
    ));
  const contactsPerNum = _contactsPerPhoneNumber(organization);
  const numbersReserved = (inventoryPhoneNumberCounts || []).reduce(
    (acc, entry) => acc + entry.count,
    0
  );
  const numbersNeeded = Math.ceil(
    (contactsCount || 0) / contactsPerNum.contactsPerPhoneNumber
  );
  // 4. which mode:
  // previously: EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS vs. EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE
  const manualMessageServiceMode = getConfig(
    "EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE",
    organization,
    { truthy: 1 }
  );
  return {
    data: {
      manualMessageServiceMode,
      inventoryPhoneNumberCounts,
      contactsAreaCodeCounts,
      phoneNumberCounts,
      messageserviceSid: campaign.messageservice_sid || null,
      useOwnMessagingService: campaign.use_own_messaging_service,
      ...contactsPerNum
    },
    fullyConfigured:
      // Two mutually exclusive modes: EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS vs. EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE
      Boolean(campaign.messageservice_sid) ||
      (numbersReserved >= numbersNeeded && !manualMessageServiceMode),
    unArchiveable: Boolean(
      !campaign.use_own_messaging_service ||
        (campaign.messageservice_sid && counts.length)
    )
  };
};

export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  // MUST NOT RETURN SECRETS!
  // called both from edit and stats contexts: editMode==true for edit page
  if (fromCampaignStatsPage) {
    // STATS: campaign.messageservice_sid (enabled)
    const counts = await ownedPhoneNumber.listCampaignNumbers(campaign.id);
    return {
      data: {
        useOwnMessagingService: campaign.use_own_messaging_service,
        messageserviceSid: campaign.messageservice_sid || null,
        ..._contactsPerPhoneNumber(organization)
      },
      unArchiveable: Boolean(
        !campaign.use_own_messaging_service ||
          (campaign.messageservice_sid && counts.length)
      )
    };
  } else {
    // EDIT
    return await _editCampaignData(organization, campaign);
  }
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  user,
  updateData,
  fromCampaignStatsPage
}) {
  // TODO:
  // 1. receive CampaignPhoneNumbers form (replace action on campaign save)
  //      inventoryPhoneNumberCounts in schema.js
  // fullyConfigured ~= campaign.messageservice_sid && owned_phone_numbers
  await accessRequired(user, campaign.organization_id, "ADMIN");
  const serviceName = getServiceNameFromOrganization(organization);

  if (updateData.useOwnMessagingService) {
    campaign.use_own_messaging_service = Boolean(
      updateData.useOwnMessagingService &&
        updateData.useOwnMessagingService !== "false"
    );
    await r
      .knex("campaign")
      .where("id", campaign.id)
      .update("use_own_messaging_service", campaign.use_own_messaging_service);
    await cacheableData.campaign.clear(campaign.id);
  }

  if (updateData.releaseCampaignNumbers) {
    if (!campaign.use_own_messaging_service) {
      throw new Error(
        "Campaign is not using its own messaging service, cannot release numbers"
      );
    }
    if (!campaign.messageservice_sid) {
      throw new Error(
        "Campaign no longer has a message service associated with it"
      );
    }

    if (serviceName === "twilio") {
      const shouldRetainServices = getConfig(
        "CAMPAIGN_PHONES_RETAIN_MESSAGING_SERVICES",
        organization,
        { truthy: 1 }
      );
      if (shouldRetainServices) {
        // retain messaging services for analytics, just clear phones
        await twilio.clearMessagingServicePhones(
          organization,
          campaign.messageservice_sid
        );
      } else {
        await twilio.deleteMessagingService(
          organization,
          campaign.messageservice_sid
        );
      }
    }

    await ownedPhoneNumber.releaseCampaignNumbers(campaign.id, r.knex);
  } else if (updateData.inventoryPhoneNumberCounts) {
    if (campaign.is_started) {
      throw new Error(
        "Cannot update phone numbers once a campaign has started"
      );
    }
    const phoneCounts = updateData.inventoryPhoneNumberCounts;
    await r.knex.transaction(async trx => {
      await ownedPhoneNumber.releaseCampaignNumbers(campaign.id, trx);
      for (const pc of phoneCounts) {
        if (pc.count) {
          await ownedPhoneNumber.allocateCampaignNumbers(
            {
              organizationId: organization.id,
              campaignId: campaign.id,
              areaCode: pc.areaCode,
              amount: pc.count
            },
            trx
          );
        }
      }
    });
  }
  await cacheableData.campaign.clear(campaign.id);
  return await _editCampaignData(organization, campaign);
}

export async function onBuyPhoneNumbers({ organization, serviceName, opts }) {
  return {
    opts: {
      skipOrgMessageService: true
    }
  };
}

export async function onGetShortcodes({ organization, serviceName, opts }) {
  return {
    opts: {
      skipOrgMessageService: true
    }
  };
}

export async function onVendorServiceFullyConfigured({
  organization,
  serviceName
}) {
  return {
    skipOrgMessageService: true
  };
}

export async function onOrganizationServiceVendorSetup({
  organization,
  newConfig,
  serviceName
}) {
  return {
    skipOrgMessageService: true
  };
}

// Prepares a messaging service with owned number for the campaign
async function prepareTwilioCampaign(campaign, organization, trx) {
  const ts = Math.floor(new Date() / 1000);
  const baseUrl = getConfig("BASE_URL", organization);
  const friendlyName = `Campaign ${campaign.id}: ${campaign.organization_id}-${ts} [${baseUrl}]`;
  let msgSrvSid = campaign.messageservice_sid;
  if (!campaign.messageservice_sid) {
    const messagingService = await twilio.createMessagingService(
      organization,
      friendlyName
    );
    msgSrvSid = messagingService.sid;
    if (!msgSrvSid) {
      throw new Error("Failed to create messaging service!");
    }
  }
  const phoneSids = (
    await trx("owned_phone_number")
      .select("service_id")
      .where({
        organization_id: campaign.organization_id,
        service: "twilio",
        allocated_to: "campaign",
        allocated_to_id: campaign.id.toString()
      })
  ).map(row => row.service_id);
  console.log(`Transferring ${phoneSids.length} numbers to ${msgSrvSid}`);
  try {
    await twilio.addNumbersToMessagingService(
      organization,
      phoneSids,
      msgSrvSid
    );
  } catch (e) {
    console.error("Failed to add numbers to messaging service", e);
    if (msgSrvSid) {
      // only delete campaign message service
      await twilio.deleteMessagingService(organization, msgSrvSid);
    }
    throw new Error("Failed to add numbers to messaging service");
  }
  return msgSrvSid;
}

export async function onCampaignStart({ organization, campaign, user }) {
  try {
    await r.knex.transaction(async trx => {
      const campaignTrx = await trx("campaign")
        .where("id", campaign.id)
        // PG only: lock this campaign while starting, making this job idempotent
        .forUpdate()
        .first();
      if (campaignTrx.is_started) {
        throw new Error("Campaign already started");
      }

      const serviceName = getServiceNameFromOrganization(organization);

      let messagingServiceSid;
      if (serviceName === "twilio") {
        messagingServiceSid = await prepareTwilioCampaign(
          campaignTrx,
          organization,
          trx
        );
      } else if (serviceName === "fakeservice") {
        // simulate some latency
        await new Promise(resolve => setTimeout(resolve, 1000));
        messagingServiceSid = "FAKEMESSAGINGSERVICE";
      } else {
        throw new Error(
          `Campaign phone numbers are not supported for service ${serviceName}`
        );
      }
      await trx("campaign")
        .where("id", campaign.id)
        .update({
          is_started: true,
          use_own_messaging_service: true,
          messageservice_sid: messagingServiceSid
        });
      await cacheableData.campaign.clear(campaign.id);
    });
  } catch (e) {
    console.error(
      `per-campaign-messageservices failed to start campaign: ${e.message}`,
      e
    );
    throw new Error(
      `per-campaign-messageservices failed to start create messageservice: ${e.message}`
    );
  }
}
