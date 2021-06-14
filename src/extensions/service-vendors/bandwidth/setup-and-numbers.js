import BandwidthNumbers from "@bandwidth/numbers";
import BandwidthMessaging from "@bandwidth/messaging";

import { log } from "../../../lib";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { sleep } from "../../../workers/lib";

import { getConfig } from "../../../server/api/lib/config";
import { getSecret, convertSecret } from "../../secret-manager";
import { getMessageServiceConfig, getConfigKey } from "../service_map";

export async function getNumbersClient(organization, options) {
  const config =
    (options && options.serviceConfig) ||
    (await getMessageServiceConfig("bandwidth", organization, {
      obscureSensitiveInformation: false
    }));
  const password = await getSecret(
    "bandwidthPassword",
    config.password,
    organization
  );
  const client = new BandwidthNumbers.Client({
    userName: config.userName,
    password: password,
    accountId: config.accountId
  });
  return { client, config };
}

export const getServiceConfig = async (
  serviceConfig,
  organization,
  options = {}
) => {
  // serviceConfig should have username, password, applicationId, and accountId
  const {
    restrictToOrgFeatures = false,
    obscureSensitiveInformation = true
  } = options;
  let password;
  if (serviceConfig) {
    // Note, allows unencrypted auth tokens to be (manually) stored in the db
    // @todo: decide if this is necessary, or if UI/envars is sufficient.
    if (serviceConfig.password) {
      password = obscureSensitiveInformation
        ? "<Encrypted>"
        : await getSecret(
            "bandwidthPassword",
            organization,
            serviceConfig.password
          );
    } else {
      password = obscureSensitiveInformation
        ? "<Hidden>"
        : serviceConfig.password;
    }
  }
  // FUTURE: should it be possible for a universal setting?  maybe
  return {
    ...serviceConfig,
    password
  };
};

export async function fullyConfigured(organization) {
  const config = await getMessageServiceConfig("bandwidth", organization);
  if (
    !config.password ||
    !config.userName ||
    !config.accountId ||
    !config.applicationId
  ) {
    return false;
  }
  // TODO: also needs some number to send with
  return true;
}

export async function updateConfig(oldConfig, config, organization) {
  // console.log('bandwidth.updateConfig', oldConfig, config, organization);
  let changes = { ...config };
  if (config.password) {
    changes.password = await convertSecret(
      "bandwdithPassword",
      organization,
      config.password
    );
  }
  const finalConfig = {
    ...oldConfig,
    ...changes
  };
  // console.log('bandwdith finalConfig', finalConfig);

  try {
    if (
      !config.siteId ||
      (!config.sipPeerId &&
        config.streetName &&
        config.city &&
        config.zip &&
        config.houseNumber &&
        config.stateCode)
    ) {
      const newAccountObjects = await createAccountBaseline(organization, {
        serviceConfig: finalConfig
      });
      Object.assign(finalConfig, newAccountObjects);
    }
    if (!config.applicationId) {
      finalConfig.applicationId = await createMessagingService(
        organization,
        `Spoke app, org Id=${organization.id}`,
        finalConfig
      );
    }
    delete finalConfig.autoConfigError;
  } catch (err) {
    console.log(
      "bandwidth.updateConfig autoconfigure Error",
      err.message,
      err.response && err.response.text,
      "xxxx",
      err
    );
    finalConfig.autoConfigError = `Auto-configuration failed. ${err.message ||
      ""} ${(err.response && err.response.text) || ""}`;
  }

  return finalConfig;
}

export async function buyNumbersInAreaCode(
  organization,
  areaCode,
  limit,
  opts
) {
  let totalPurchased = 0;
  const { client, config } = await getNumbersClient(organization);
  let orderId;
  if (areaCode === "800") {
    // tollFree
    const order = await BandwidthNumbers.Order.createAsync(client, {
      name: `Spoke ${limit} order for org ${organization.id}`,
      quantity: limit || 1,
      siteId: config.siteId,
      peerId: config.sipPeerId,
      tollFreeWildCardPattern: "8**"
    });
    orderId = order.id;
    console.log("bandwidth order details", JSON.stringify(order));
  }
  if (orderId) {
    let result;
    // poll
    // sleep....
    for (let i = 0; i < 5; i++) {
      result = await BandwidthNumbers.Order.getAsync(client, orderId);
      if (result.orderStatus === "COMPLETE") {
        const newNumbers = result.completedNumbers.map(cn => ({
          organization_id: organization.id,
          area_code: cn.telephoneNumber.fullNumber.slice(0, 3),
          phone_number: getFormattedPhoneNumber(cn.telephoneNumber.fullNumber),
          service: "bandwidth",
          allocated_to_id: config.sipPeerId,
          service_id: cn.telephoneNumber.fullNumber,
          allocated_at: new Date()
        }));
        await r.knex("owned_phone_number").insert(newNumbers);
        totalPurchased = newNumbers.length;
        break;
      } else {
        // TODO: is this reasonable?
        await sleep(2000);
      }
    }
  }
  return totalPurchased;
}

export async function deleteNumbersInAreaCode(organization, areaCode) {
  // TODO
  // disconnect (i.e. delete/drop) numbers
  //await numbers.Disconnect.createAsync("Disconnect Order Name", ["9195551212", ...])
  const { client, config } = await getNumbersClient(organization);
}

export async function createAccountBaseline(organization, options) {
  // Does most of the things in Getting Started section of:
  // https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html
  // except creating an 'application' (messaging service in Spoke parlance)
  // These pieces don't need to be done per-application/messagingservice
  const configChanges = {};
  const { client, config } = await getNumbersClient(organization, options);
  // 1. create sub-account/Site
  if (!config.siteId || (options && options.newEverything)) {
    const site = await BandwidthNumbers.Site.createAsync(client, {
      name: `Spoke org${organization.id} ${organization.name} (Subaccount)`,
      address: {
        houseNumber: config.houseNumber,
        streetName: config.streetName,
        city: config.city,
        stateCode: config.stateCode,
        zip: config.zip,
        addressType: config.addressType || "Billing",
        country: config.country || "United States"
      }
    });
    configChanges.siteId = site.id;
  }
  const siteId = configChanges.siteId || config.siteId;
  // 2. create location/sippeer (w/ address)
  let location;
  if (!config.sipPeerId || (options && options.newEverything)) {
    location = await BandwidthNumbers.SipPeer.createAsync(client, {
      siteId,
      // Peer Names can only contain alphanumerics
      peerName: `Spoke org${organization.id} ${organization.name.replace(
        /\W/,
        ""
      )}`,
      isDefaultPeer: true
    });
    configChanges.sipPeerId = location.id;
  } else {
    location = await BandwidthNumbers.SipPeer.getAsync(
      client,
      siteId,
      config.sipPeerId
    );
  }
  // 3. Enable SMS and MMS on location
  // Note: create your own if you want different parameters (enforced)
  await location.createSmsSettingsAsync({
    sipPeerSmsFeatureSettings: {
      tollFree: true,
      protocol: "http",
      zone1: true,
      zone2: false,
      zone3: false,
      zone4: false,
      zone5: false
    },
    httpSettings: {}
  });
  await location.createMmsSettingsAsync({
    mmsSettings: {
      protocol: "HTTP"
    },
    protocols: {
      HTTP: {
        httpSettings: {}
      }
    }
  });
  return configChanges;
}

export async function createMessagingService(
  organization,
  friendlyName,
  serviceConfig
) {
  const baseUrl = getConfig("BASE_URL", organization);
  if (!baseUrl || /\/\/localhost(:|\/)/.test(baseUrl)) {
    return;
  }
  const { client, config } = await getNumbersClient(organization, {
    serviceConfig
  });
  // 1. create application
  const application = await BandwidthNumbers.Application.createMessagingApplicationAsync(
    client,
    {
      appName: friendlyName || "Spoke app",
      msgCallbackUrl: `${baseUrl}/bandwidth/${(organization &&
        organization.id) ||
        ""}`,
      callbackCreds: {
        userId: "bandwidth.com",
        password: "testtest" // TODO: see index.js
      },
      requestedCallbackTypes: [
        "message-delivered",
        "message-failed",
        "message-sending"
      ].map(c => ({ callbackType: c }))
    }
  );
  console.log("bandwidth createMessagingService", JSON.stringify(result));
  // 2. assign application to subaccount|site and location|sippeer
  const location = await BandwidthNumbers.SipPeer.getAsync(
    client,
    config.siteId,
    config.sipPeerId
  );
  await location.editApplicationAsync({
    httpMessagingV2AppId: application.applicationId
  });
  return application.applicationId;
}

export async function deleteMessagingService(
  organization,
  messagingServiceSid
) {
  const { client } = await getNumbersClient(organization);
  const application = await BandwidthNumbers.Application.getAsync(
    client,
    messagingServiceSid
  );
  await application.deleteAsync();
}
