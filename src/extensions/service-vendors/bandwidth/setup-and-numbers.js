import { createHmac } from "crypto";

import BandwidthNumbers from "@bandwidth/numbers";
import BandwidthMessaging from "@bandwidth/messaging";

import { log } from "../../../lib";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { sleep } from "../../../workers/lib";
import { r } from "../../../server/models";

import { getConfig } from "../../../server/api/lib/config";
import { getSecret, convertSecret } from "../../secret-manager";
import { getMessageServiceConfig, getConfigKey } from "../service_map";

export async function getNumbersClient(organization, options) {
  let config;
  let password;
  if (options && options.serviceConfig) {
    config = options.serviceConfig;
    console.log("bandwidth.getNumbersClient.serviceConfig", config);
    password = await getSecret(
      "bandwidthPassword",
      config.password,
      organization
    );
  } else {
    config = await getMessageServiceConfig("bandwidth", organization, {
      obscureSensitiveInformation: false
    });
    console.log(
      "bandwidth.getNumbersClient.getMessageServiceConfig",
      config.userName,
      config.accountId
    );
    password = config.password;
  }

  const client = new BandwidthNumbers.Client({
    userName: config.userName,
    password: password,
    accountId: config.accountId
  });
  return { client, config };
}

export const webhookBasicAuthPw = organizationId => {
  // password has a max of 63 chars
  const hmac = createHmac("sha256", getConfig("SESSION_SECRET") || "");
  hmac.update(getConfig("BASE_URL") || "");
  hmac.update(String(organizationId));
  return hmac.digest("base64");
};

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
    if (serviceConfig.password) {
      password = obscureSensitiveInformation
        ? "<Encrypted>"
        : /// TODO: checkout args order here for getSecret?  also will this be redundant to call in getNumbersClient?
          /// then conflicts with saving-initial vs. load
          await getSecret(
            "bandwidthPassword",
            serviceConfig.password,
            organization
          );
    } else {
      password = obscureSensitiveInformation
        ? "<Hidden>"
        : serviceConfig.password;
    }
  }
  // FUTURE: should it be possible for a universal setting?  maybe
  const serviceManagers = getConfig("SERVICE_MANAGERS", organization) || "";
  return {
    ...serviceConfig,
    password,
    serviceManagerNumPicker: /numpicker/.test(serviceManagers),
    serviceManagerSticky: /sticky-sender/.test(serviceManagers)
  };
};

export async function fullyConfigured(organization) {
  const config = await getMessageServiceConfig("bandwidth", organization);
  const serviceManagers = getConfig("SERVICE_MANAGERS", organization) || "";
  if (
    !config.password ||
    !config.userName ||
    !config.accountId ||
    !config.applicationId ||
    // serviceManagers tests purposefully avoid looking for delimeters,
    // so different numpicker/sticky modules can be used
    !/numpicker/.test(serviceManagers) ||
    !/sticky-sender/.test(serviceManagers)
  ) {
    return false;
  }
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
        `Spoke app, org${organization.id}`,
        finalConfig
      );
    }
    delete finalConfig.autoConfigError;
    if (true || config.sipPeerId !== finalConfig.sipPeerId) {
      await syncAccountNumbers(organization, {
        serviceConfig: finalConfig
      });
    }
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
          allocated_to_id: null,
          service_id: `${config.sipPeerId}.${cn.telephoneNumber.fullNumber}`,
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

export async function syncAccountNumbers(organization, options) {
  const { client, config } = await getNumbersClient(organization, options);
  if (!config.siteId || !config.sipPeerId) {
    return;
  }
  const sipPeer = await BandwidthNumbers.SipPeer.getAsync(
    client,
    config.siteId,
    config.sipPeerId
  );
  const telephoneNumbers = await sipPeer.getTnsAsync();
  // [ { fullNumber: '2135551234' }, .... ]
  console.log("syncAccountNumbers", telephoneNumbers.length);
  if (telephoneNumbers.length) {
    const nums = telephoneNumbers.map(tn => `+1${tn.fullNumber}`);
    const existingNums = await r
      .knex("owned_phone_number")
      .where("service", "bandwidth")
      .whereIn("phone_number", nums)
      .pluck("phone_number");
    const newNums = existingNums.length
      ? nums.filter(e => existingNums.indexOf(e) == -1)
      : nums;
    if (newNums.length) {
      console.log("Bandwidth, new numbers to load", newNums.length, newNums[0]);
      const newNumbers = newNums.map(tn => ({
        organization_id: organization.id,
        area_code: tn.slice(2, 5),
        phone_number: tn,
        service: "bandwidth",
        allocated_to_id: null,
        service_id: `${config.sipPeerId}.${tn.slice(2)}`,
        allocated_at: new Date()
      }));
      await r.knex("owned_phone_number").insert(newNumbers);
    }
  }
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
      // subaccount names max=50 characters
      name: `Spoke org${organization.id} ${organization.name.substr(0, 38)}`,
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
        /\W/g,
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
      protocol: "HTTP",
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
  const callbackUrl = `${baseUrl}/bandwidth/${(organization &&
    organization.id) ||
    ""}`;
  const application = await BandwidthNumbers.Application.createMessagingApplicationAsync(
    client,
    {
      appName: friendlyName || "Spoke app",
      callbackUrl,
      msgCallbackUrl: callbackUrl,
      inboundCallbackUrl: callbackUrl,
      outboundCallbackUrl: callbackUrl,
      callbackCreds: {
        userId: "bandwidth.com",
        password: webhookBasicAuthPw(organization.id)
      },
      requestedCallbackTypes: {
        callbackType: ["message-sending", "message-delivered", "message-failed"]
      }
    }
  );
  console.log("bandwidth createMessagingService", JSON.stringify(application));
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
