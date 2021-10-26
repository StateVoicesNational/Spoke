/* eslint-disable no-use-before-define, no-console */
import _ from "lodash";
import Twilio, { twiml } from "twilio";
import urlJoin from "url-join";
import { log } from "../../../lib";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import {
  cacheableData,
  Log,
  Message,
  PendingMessagePart,
  r
} from "../../../server/models";
import wrap from "../../../server/wrap";
import { getSecret, convertSecret } from "../../secret-manager";

import { saveNewIncomingMessage, parseMessageText } from "../message-sending";
import { getMessageServiceConfig, getConfigKey } from "../service_map";

// TWILIO error_codes:
// > 1 (i.e. positive) error_codes are reserved for Twilio error codes
// -1 - -MAX_SEND_ATTEMPTS (5): failed send messages
// -100-....: custom local errors
// -101: incoming message with a MediaUrl
// -166: blocked send for profanity message_handler match

const MAX_SEND_ATTEMPTS = 5;
const MESSAGE_VALIDITY_PADDING_SECONDS = 30;
const MAX_TWILIO_MESSAGE_VALIDITY = 14400;
const ENABLE_DB_LOG = getConfig("ENABLE_DB_LOG");
const TWILIO_SKIP_VALIDATION = getConfig("TWILIO_SKIP_VALIDATION");
const BULK_REQUEST_CONCURRENCY = 5;
const MAX_NUMBERS_PER_BUY_JOB = getConfig("MAX_NUMBERS_PER_BUY_JOB") || 100;
export const twilioLibrary = { Twilio, twiml };

export const getMetadata = () => ({
  supportsOrgConfig: getConfig("TWILIO_MULTI_ORG", null, { truthy: true }),
  supportsCampaignConfig: false,
  name: "twilio"
});

export const getTwilio = async organization => {
  const { authToken, accountSid } = await getMessageServiceConfig(
    "twilio",
    organization,
    { obscureSensitiveInformation: false }
  );
  if (accountSid && authToken) {
    return twilioLibrary.Twilio(accountSid, authToken); // eslint-disable-line new-cap
  }
  return null;
};

/**
 * Validate that the message came from Twilio before proceeding.
 *
 * @param url The external-facing URL; this may be omitted to use the URL from the request.
 */
const headerValidator = url => {
  if (!!TWILIO_SKIP_VALIDATION) return (req, res, next) => next();

  return async (req, res, next) => {
    const organization = req.params.orgId
      ? await cacheableData.organization.load(req.params.orgId)
      : null;
    const { authToken } = await getMessageServiceConfig(
      "twilio",
      organization,
      { obscureSensitiveInformation: false }
    );
    const options = {
      validate: true,
      protocol: "https",
      url
    };

    return Twilio.webhook(authToken, options)(req, res, next);
  };
};

export const errorDescriptions = {
  12300: "Twilio is unable to process the Content-Type of the provided URL.",
  12400: "Internal (Twilio) Failure",
  20429: "Too Many Requests: Twilio queue is full. OK to retry",
  21211: "Invalid 'To' Phone Number",
  21408: "Attempt to send to disabled region",
  21602: "Message body is required",
  21610: "Attempt to send to unsubscribed recipient",
  21611: "Source number has exceeded max number of queued messages",
  21612: "Unreachable via SMS or MMS",
  21614: "Invalid mobile number",
  21617: "Message body exceeds the 1600 character limit",
  21621: "From-number is not enabled for MMS (note 800 nums can't send MMS)",
  30001: "Queue overflow",
  30002: "Account suspended",
  30003: "Unreachable destination handset",
  30004: "Message blocked",
  30005: "Unknown destination handset",
  30006: "Landline or unreachable carrier",
  30007: "Message Delivery - Carrier violation",
  30008: "Message Delivery - Unknown error"
};

export function errorDescription(errorCode) {
  return {
    code: errorCode,
    description: errorDescriptions[errorCode] || "Twilio error",
    link: `https://www.twilio.com/docs/api/errors/${errorCode}`
  };
}

export function addServerEndpoints(addPostRoute) {
  addPostRoute(
    "/twilio/:orgId?",
    headerValidator(
      process.env.TWILIO_MESSAGE_CALLBACK_URL ||
        global.TWILIO_MESSAGE_CALLBACK_URL
    ),
    wrap(async (req, res) => {
      try {
        await handleIncomingMessage(req.body);
      } catch (ex) {
        log.error(ex);
      }
      const resp = new twilioLibrary.twiml.MessagingResponse();
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(resp.toString());
    })
  );

  const messageReportHooks = [];
  if (
    getConfig("TWILIO_STATUS_CALLBACK_URL") ||
    getConfig("TWILIO_VALIDATION")
  ) {
    messageReportHooks.push(
      headerValidator(
        process.env.TWILIO_STATUS_CALLBACK_URL ||
          global.TWILIO_STATUS_CALLBACK_URL
      )
    );
  }
  messageReportHooks.push(
    wrap(async (req, res) => {
      try {
        const body = req.body;
        await handleDeliveryReport(body);
      } catch (ex) {
        log.error(ex);
      }
      const resp = new twilioLibrary.twiml.MessagingResponse();
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(resp.toString());
    })
  );

  addPostRoute("/twilio-message-report/:orgId?", ...messageReportHooks);
}

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0];
  const userNumber = firstPart.user_number;
  const contactNumber = firstPart.contact_number;
  const serviceMessages = messageParts.map(part =>
    JSON.parse(part.service_message)
  );
  const text = serviceMessages
    .map(serviceMessage => serviceMessage.Body)
    .join("")
    .replace(/\0/g, ""); // strip all UTF-8 null characters (0x00)
  const media = serviceMessages
    .map(serviceMessage => {
      const mediaItems = [];
      for (let m = 0; m < Number(serviceMessage.NumMedia); m++) {
        mediaItems.push({
          type: serviceMessage[`MediaContentType${m}`],
          url: serviceMessage[`MediaUrl${m}`]
        });
      }
      return mediaItems;
    })
    .reduce((acc, val) => acc.concat(val), []); // flatten array
  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    media,
    error_code: null,
    service_id: firstPart.service_id,
    // will be set during cacheableData.message.save()
    // campaign_contact_id: lastMessage.campaign_contact_id,
    messageservice_sid: serviceMessages[0].MessagingServiceSid,
    service: "twilio",
    send_status: "DELIVERED",
    user_id: null
  });
}

async function getMessagingServiceSid(
  organization,
  contact,
  message,
  _campaign
) {
  // NOTE: because of this check you can't switch back to organization/global
  // messaging service without breaking running campaigns.
  if (
    getConfig(
      "EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE",
      organization,
      { truthy: true }
    ) ||
    getConfig("EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS", organization, {
      truthy: true
    })
  ) {
    const campaign =
      _campaign || (await cacheableData.campaign.load(contact.campaign_id));
    if (campaign.messageservice_sid) {
      return campaign.messageservice_sid;
    }
  }

  return await cacheableData.organization.getMessageServiceSid(
    organization,
    contact,
    message.text
  );
}

export async function sendMessage({
  message,
  contact,
  trx,
  organization,
  campaign,
  serviceManagerData
}) {
  const twilio = await exports.getTwilio(organization);
  const APITEST = /twilioapitest/.test(message.text);
  if (!twilio && !APITEST) {
    log.warn(
      "cannot actually send SMS message -- twilio is not fully configured:",
      message.id
    );
    if (message.id) {
      let updateQuery = r
        .knex("message")
        .where("id", message.id)
        .update({ send_status: "SENT", sent_at: new Date() });
      if (trx) {
        updateQuery = updateQuery.transacting(trx);
      }
      await updateQuery;
    }
    return "test_message_uuid";
  }

  // Note organization won't always be available, so then contact can trace to it
  const messagingServiceSid =
    (serviceManagerData && serviceManagerData.messageservice_sid) ||
    (await getMessagingServiceSid(organization, contact, message, campaign));

  let userNumber =
    (serviceManagerData && serviceManagerData.user_number) ||
    message.user_number;

  return new Promise((resolve, reject) => {
    if (message.service !== "twilio") {
      log.warn("Message not marked as a twilio message", message.id);
    }

    let twilioValidityPeriod = process.env.TWILIO_MESSAGE_VALIDITY_PERIOD;

    if (message.send_before) {
      // the message is valid no longer than the time between now and
      // the send_before time, less 30 seconds
      // we subtract the MESSAGE_VALIDITY_PADDING_SECONDS seconds to allow time for the message to be sent by
      // a downstream service
      const messageValidityPeriod =
        Math.ceil((message.send_before - Date.now()) / 1000) -
        MESSAGE_VALIDITY_PADDING_SECONDS;

      if (messageValidityPeriod < 0) {
        // this is an edge case
        // it means the message arrived in this function already too late to be sent
        // pass the negative validity period to twilio, and let twilio respond with an error
      }

      if (twilioValidityPeriod) {
        twilioValidityPeriod = Math.min(
          twilioValidityPeriod,
          messageValidityPeriod,
          MAX_TWILIO_MESSAGE_VALIDITY
        );
      } else {
        twilioValidityPeriod = Math.min(
          messageValidityPeriod,
          MAX_TWILIO_MESSAGE_VALIDITY
        );
      }
    }
    const changes = {};

    if (userNumber && message.user_number != userNumber) {
      changes.user_number = userNumber;
    }
    if (
      messagingServiceSid &&
      message.messageservice_sid != messagingServiceSid
    ) {
      changes.messageservice_sid = messagingServiceSid;
    }

    const messageParams = Object.assign(
      {
        to: message.contact_number,
        body: message.text,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
      },
      userNumber ? { from: userNumber } : {},
      messagingServiceSid ? { messagingServiceSid } : {},
      twilioValidityPeriod ? { validityPeriod: twilioValidityPeriod } : {},
      parseMessageText(message)
    );

    console.log("twilioMessage", messageParams);
    if (APITEST) {
      let fakeErr = null;
      let fakeResponse = null;
      if (/twilioapitesterrortimeout/.test(message.text)) {
        fakeErr = {
          status: "ESOCKETTIMEDOUT",
          message:
            'FAKE TRIGGER(apierrortest) Unable to reach host: "api.twilio.com"'
        };
      } else {
        fakeResponse = {
          sid: `FAKETWILIIO${Math.random()}`
        };
      }
      postMessageSend(
        message,
        contact,
        trx,
        resolve,
        reject,
        fakeErr,
        fakeResponse,
        organization,
        changes
      );
    } else {
      twilio.messages.create(messageParams, (err, response) => {
        postMessageSend(
          message,
          contact,
          trx,
          resolve,
          reject,
          err,
          response,
          organization,
          changes
        );
      });
    }
  });
}

export function postMessageSend(
  message,
  contact,
  trx,
  resolve,
  reject,
  err,
  response,
  organization,
  changes
) {
  let changesToSave = changes
    ? {
        ...changes
      }
    : {};
  log.info("postMessageSend", message, changes, response, err);
  let hasError = false;
  if (err) {
    hasError = true;
    log.error("Error sending message", err);
    console.log("Error sending message", err);
  }
  if (response) {
    changesToSave.service_id = response.sid;
    hasError = !!response.error_code;
    if (hasError) {
      changesToSave.error_code = response.error_code;
      changesToSave.send_status = "ERROR";
    }
  }
  let updateQuery = r.knex("message").where("id", message.id);
  if (trx) {
    updateQuery = updateQuery.transacting(trx);
  }

  if (hasError) {
    if (err) {
      // TODO: for some errors we should *not* retry
      // e.g. 21617 is max character limit
      if (message.error_code <= -MAX_SEND_ATTEMPTS) {
        changesToSave.send_status = "ERROR";
      }
      // decrement error code starting from zero
      changesToSave.error_code = Number(message.error_code || 0) - 1;
    }

    let contactUpdateQuery = Promise.resolve(1);
    if (message.campaign_contact_id && changesToSave.error_code) {
      contactUpdateQuery = r
        .knex("campaign_contact")
        .where("id", message.campaign_contact_id)
        .update("error_code", changesToSave.error_code);
      if (trx) {
        contactUpdateQuery = contactUpdateQuery.transacting(trx);
      }
    }

    updateQuery = updateQuery.update(changesToSave);

    Promise.all([updateQuery, contactUpdateQuery]).then(() => {
      console.log("Saved message error status", changesToSave, err);
      reject(
        err ||
          (response
            ? new Error(JSON.stringify(response))
            : new Error("Encountered unknown error"))
      );
    });
  } else {
    changesToSave = {
      ...changesToSave,
      send_status: "SENT",
      service: "twilio",
      sent_at: new Date()
    };
    Promise.all([
      updateQuery.update(changesToSave),
      cacheableData.campaignContact.updateStatus(
        contact,
        undefined,
        changesToSave.messageservice_sid || changesToSave.user_number
      )
    ])
      .then(() => {
        resolve({
          ...message,
          ...changesToSave
        });
      })
      .catch(caught => {
        console.error(
          "Failed message and contact update on twilio postMessageSend",
          caught
        );
        reject(caught);
      });
  }
}

export async function handleDeliveryReport(report) {
  const messageSid = report.MessageSid;
  if (messageSid) {
    const messageStatus = report.MessageStatus;

    // Scalability: we don't care about "queued" and "sent" status updates so
    // we skip writing to the database.
    // Log just in case we need to debug something. Detailed logs can be viewed here:
    // https://www.twilio.com/log/sms/logs/<SID>
    log.info(`Message status ${messageSid}: ${messageStatus}`);
    if (messageStatus === "queued" || messageStatus === "sent") {
      return;
    }

    if (ENABLE_DB_LOG) {
      await Log.save({
        message_sid: report.MessageSid,
        body: JSON.stringify(report),
        error_code: Number(report.ErrorCode || 0) || 0,
        from_num: report.From || null,
        to_num: report.To || null
      });
    }

    if (
      messageStatus === "delivered" ||
      messageStatus === "failed" ||
      messageStatus === "undelivered"
    ) {
      const errorCode = Number(report.ErrorCode || 0) || 0;
      await cacheableData.message.deliveryReport({
        contactNumber: report.To,
        userNumber: report.From,
        messageSid: report.MessageSid,
        service: "twilio",
        messageServiceSid: report.MessagingServiceSid,
        newStatus: messageStatus === "delivered" ? "DELIVERED" : "ERROR",
        errorCode,
        statusCode: errorCode === 30006 ? -1 : null
      });
    }
  }
}

export async function handleIncomingMessage(message) {
  if (
    !message.hasOwnProperty("From") ||
    !message.hasOwnProperty("To") ||
    !message.hasOwnProperty("Body") ||
    !message.hasOwnProperty("MessageSid")
  ) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`);
  }

  const { From, To, MessageSid } = message;
  const contactNumber = getFormattedPhoneNumber(From);
  const userNumber = To ? getFormattedPhoneNumber(To) : "";

  const pendingMessagePart = new PendingMessagePart({
    service: "twilio",
    service_id: MessageSid,
    parent_id: null,
    service_message: JSON.stringify(message),
    user_number: userNumber,
    contact_number: contactNumber
  });
  if (process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS) {
    // Handle the message directly and skip saving an intermediate part
    const finalMessage = await convertMessagePartsToMessage([
      pendingMessagePart
    ]);
    console.log("Contact reply", finalMessage, pendingMessagePart);
    if (finalMessage) {
      if (message.spokeCreatedAt) {
        finalMessage.created_at = message.spokeCreatedAt;
      }
      await saveNewIncomingMessage(finalMessage);
    }
  } else {
    // If multiple processes, just insert the message part and let another job handle it
    await r.knex("pending_message_part").insert(pendingMessagePart);
  }

  // store mediaurl data in Log, so it can be extracted manually
  if (ENABLE_DB_LOG) {
    await Log.save({
      message_sid: MessageSid,
      body: JSON.stringify(message),
      error_code: -101,
      from_num: From || null,
      to_num: To || null
    });
  }
}

/**
 * getContactInfo: does a lookup for carrier and optionally the contact name
 */
export async function getContactInfo({
  organization,
  contactNumber,
  // Boolean: maybe twilio-specific?
  lookupName
}) {
  if (!contactNumber) {
    return {};
  }
  const twilio = await exports.getTwilio(organization);
  const types = ["carrier"];
  if (lookupName) {
    // caller-name is more expensive
    types.push("caller-name");
  }
  const contactInfo = {
    contact_number: contactNumber,
    organization_id: organization.id,
    service: "twilio"
  };
  try {
    const phoneNumber = await twilio.lookups.v1
      .phoneNumbers(contactNumber)
      .fetch({ type: types });

    if (phoneNumber.carrier) {
      contactInfo.carrier = phoneNumber.carrier.name;
    }
    if (phoneNumber.carrier.error_code) {
      // e.g. 60600: Unprovisioned or Out of Coverage
      contactInfo.status_code = -2;
      contactInfo.last_error_code = phoneNumber.carrier.error_code;
    } else if (
      phoneNumber.carrier.type &&
      phoneNumber.carrier.type === "landline"
    ) {
      // landline (not mobile or voip)
      contactInfo.status_code = -1;
    } else if (
      phoneNumber.countryCode &&
      getConfig("PHONE_NUMBER_COUNTRY", organization) &&
      getConfig("PHONE_NUMBER_COUNTRY", organization) !==
        phoneNumber.countryCode
    ) {
      contactInfo.status_code = -3; // wrong country
    } else if (
      phoneNumber.carrier.type &&
      phoneNumber.carrier.type !== "landline"
    ) {
      // mobile, voip
      contactInfo.status_code = 1;
    }

    if (phoneNumber.callerName) {
      contactInfo.lookup_name = phoneNumber.callerName;
    }
    // console.log('twilio.getContactInfo', contactInfo, phoneNumber);
    return contactInfo;
  } catch (err) {
    /* oddly, very rarely Twilio returns a 404 error message
       when looking up what appears to be a valid number
       https://www.twilio.com/docs/api/errors/20404

       the message appears like:
      "The requested resource /PhoneNumbers/{cell} was not found"

      the assumption is that this must not be a real number if it can't
      even be validated, so we should just delete it

      try it with this number:
      https://lookups.twilio.com/v1/PhoneNumbers/+15056405970?Type=carrier
    */
    if (err.message.includes("was not found")) {
      return {
        ...contactInfo,
        status_code: -4 // twilio api error
      };
    }
    throw err;
  }
}

/**
 * Create a new Twilio messaging service
 */
export async function createMessagingService(organization, friendlyName) {
  console.log("twilio.createMessagingService", organization.id, friendlyName);
  const twilio = await exports.getTwilio(organization);
  const twilioBaseUrl =
    getConfig("TWILIO_BASE_CALLBACK_URL", organization) ||
    getConfig("BASE_URL");
  return await twilio.messaging.services.create({
    friendlyName,
    statusCallback: urlJoin(
      twilioBaseUrl,
      "twilio-message-report",
      organization.id.toString()
    ),
    inboundRequestUrl: urlJoin(
      twilioBaseUrl,
      "twilio",
      organization.id.toString()
    )
  });
}

/**
 * Search for phone numbers available for purchase
 */
async function searchForAvailableNumbers(
  twilioInstance,
  countryCode,
  areaCode,
  limit
) {
  const count = Math.min(limit, 30); // Twilio limit
  const criteria = {
    limit: count,
    capabilities: ["SMS", "MMS"]
  };
  let numberType = "local";
  if (areaCode === "800") {
    numberType = "tollFree";
  } else {
    criteria.areaCode = areaCode;
  }
  return twilioInstance
    .availablePhoneNumbers(countryCode)
    [numberType].list(criteria);
}

/**
 * Provide a Twilio console link to the messagingService object (for configuration)
 */
export function messageServiceLink(organization, messagingServiceSid) {
  return `https://www.twilio.com/console/sms/services/${messagingserviceSid}/`;
}

/**
 * Fetch Phone Numbers assigned to Messaging Service
 */
async function getPhoneNumbersForService(organization, messagingServiceSid) {
  const twilio = await exports.getTwilio(organization);
  return await twilio.messaging
    .services(messagingServiceSid)
    .phoneNumbers.list({ limit: 400 });
}

/**
 * Add bought phone number to a Messaging Service
 */
async function addNumberToMessagingService(
  twilioInstance,
  phoneNumberSid,
  messagingServiceSid
) {
  return await twilioInstance.messaging
    .services(messagingServiceSid)
    .phoneNumbers.create({ phoneNumberSid });
}

/**
 * Buy a phone number and add it to the owned_phone_number table
 */
async function buyNumber(
  organization,
  twilioInstance,
  phoneNumber,
  opts = {},
  messageServiceSid
) {
  const response = await twilioInstance.incomingPhoneNumbers.create({
    phoneNumber,
    friendlyName: `Managed by Spoke [${process.env.BASE_URL}]: ${phoneNumber}`,
    voiceUrl: getConfig("TWILIO_VOICE_URL", organization) // will use default twilio recording if undefined
  });

  if (response.error) {
    throw new Error(`Error buying twilio number: ${response.error}`);
  }

  log.debug(`Bought number ${phoneNumber} [${response.sid}]`);

  let allocationFields = {};
  let messagingServiceSid = messageServiceSid;
  if (opts) {
    if (opts.messagingServiceSid) {
      messagingServiceSid = opts.messagingServiceSid;
    } else if (opts.skipOrgMessageService) {
      messagingServiceSid = null;
    }
  }

  if (messagingServiceSid) {
    await addNumberToMessagingService(
      twilioInstance,
      response.sid,
      messagingServiceSid
    );
    allocationFields = {
      allocated_to: "messaging_service",
      allocated_to_id: messagingServiceSid,
      allocated_at: new Date()
    };
  }
  // Note: relies on the fact that twilio returns E. 164 formatted numbers
  //  and only works in the US
  const areaCode = phoneNumber.slice(2, 5);
  return await r.knex("owned_phone_number").insert({
    organization_id: organization.id,
    area_code: areaCode,
    phone_number: phoneNumber,
    service: "twilio",
    service_id: response.sid,
    ...allocationFields
  });
}

async function bulkRequest(array, fn) {
  const chunks = _.chunk(array, BULK_REQUEST_CONCURRENCY);
  const results = [];
  for (const chunk of chunks) {
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}

/**
 * Buy up to <limit> numbers in <areaCode>
 */
export async function buyNumbersInAreaCode(
  organization,
  areaCode,
  limit,
  opts = {}
) {
  const twilioInstance = await exports.getTwilio(organization);
  const countryCode = getConfig("PHONE_NUMBER_COUNTRY ", organization) || "US";
  const messageServiceSid = await getMessageServiceSid(organization);
  async function buyBatch(size) {
    let successCount = 0;
    log.debug(`Attempting to buy batch of ${size} numbers`);

    const response = await searchForAvailableNumbers(
      twilioInstance,
      countryCode,
      areaCode,
      size
    );

    await bulkRequest(response, async item => {
      await buyNumber(
        organization,
        twilioInstance,
        item.phoneNumber,
        opts,
        messageServiceSid
      );
      successCount++;
    });

    log.debug(`Successfully bought ${successCount} number(s)`);
    return successCount;
  }

  const totalRequested = Math.min(limit, MAX_NUMBERS_PER_BUY_JOB);
  let totalPurchased = 0;
  while (totalPurchased < totalRequested) {
    const nextBatchSize = Math.min(30, totalRequested - totalPurchased);
    const purchasedInBatch = await buyBatch(nextBatchSize);
    totalPurchased += purchasedInBatch;
    if (purchasedInBatch === 0) {
      log.warn("Failed to buy as many numbers as requested");
      break;
    }
  }
  return totalPurchased;
}

export async function addNumbersToMessagingService(
  organization,
  phoneSids,
  messagingServiceSid
) {
  const twilioInstance = await exports.getTwilio(organization);
  return await bulkRequest(phoneSids, async phoneNumberSid =>
    twilioInstance.messaging
      .services(messagingServiceSid)
      .phoneNumbers.create({ phoneNumberSid })
  );
}

/**
 * Release a phone number and delete it from the owned_phone_number table
 */
async function deleteNumber(twilioInstance, phoneSid, phoneNumber) {
  await twilioInstance
    .incomingPhoneNumbers(phoneSid)
    .remove()
    .catch(err => {
      // Error 20404 means the number does not exist in Twilio. Should be
      // safe to delete from Spoke inventory. Otherwise, throw error and
      // don't delete from Spoke.
      if (err.code === 20404) {
        log.error(
          `Number not found in Twilio, may have already been released: ${phoneNumber} [${phoneSid}]`
        );
      } else {
        throw new Error(`Error deleting twilio number: ${err}`);
      }
    });
  log.debug(`Deleted number ${phoneNumber} [${phoneSid}]`);
  return await r
    .knex("owned_phone_number")
    .del()
    .where("service_id", phoneSid);
}

/**
 * Delete all non-allocted phone numbers in an area code
 */
export async function deleteNumbersInAreaCode(organization, areaCode) {
  const twilioInstance = await exports.getTwilio(organization);
  const numbersToDelete = await r
    .knex("owned_phone_number")
    .select("service_id", "phone_number")
    .where({
      organization_id: organization.id,
      area_code: areaCode,
      service: "twilio"
    })
    .where(function() {
      this.whereNull("allocated_to").orWhere(
        "allocated_to",
        "messaging_service"
      );
    });
  let successCount = 0;
  for (const n of numbersToDelete) {
    await deleteNumber(twilioInstance, n.service_id, n.phone_number);
    successCount++;
  }
  log.debug(`Successfully deleted ${successCount} number(s)`);
  return successCount;
}

export async function deleteMessagingService(
  organization,
  messagingServiceSid
) {
  const twilioInstance = await exports.getTwilio(organization);
  console.log("Deleting messaging service", messagingServiceSid);
  return twilioInstance.messaging.services(messagingServiceSid).remove();
}

export async function clearMessagingServicePhones(
  organization,
  messagingServiceSid
) {
  const twilioInstance = await exports.getTwilio(organization);
  console.log("Deleting phones from messaging service", messagingServiceSid);

  const phones = await twilioInstance.messaging
    .services(messagingServiceSid)
    .phoneNumbers.list();

  let retries = 0;
  const tryRemovePhone = async phone => {
    try {
      await twilioInstance.messaging
        .services(messagingServiceSid)
        .phoneNumbers(phone.sid)
        .remove();
      retries = 0;
    } catch (err) {
      if (retries >= 5) throw err;
      retries += 1;
      await new Promise(res => setTimeout(res, 500));
      await tryRemovePhone(phone);
    }
  };

  for (const phone of phones) {
    await tryRemovePhone(phone);
  }
}

export const getServiceConfig = async (
  serviceConfig,
  organization,
  options = {}
) => {
  const {
    restrictToOrgFeatures = false,
    obscureSensitiveInformation = true
  } = options;
  let authToken;
  let accountSid;
  let messageServiceSid;
  if (serviceConfig) {
    const hasEncryptedToken = serviceConfig.TWILIO_AUTH_TOKEN_ENCRYPTED;
    // Note, allows unencrypted auth tokens to be (manually) stored in the db
    // @todo: decide if this is necessary, or if UI/envars is sufficient.
    if (hasEncryptedToken) {
      authToken = obscureSensitiveInformation
        ? "<Encrypted>"
        : await getSecret(
            "TWILIO_AUTH_TOKEN_ENCRYPTED",
            serviceConfig.TWILIO_AUTH_TOKEN_ENCRYPTED,
            organization
          );
    } else {
      authToken = obscureSensitiveInformation
        ? "<Hidden>"
        : serviceConfig.TWILIO_AUTH_TOKEN;
    }
    accountSid = serviceConfig.TWILIO_ACCOUNT_SID
      ? serviceConfig.TWILIO_ACCOUNT_SID
      : // Check old TWILIO_API_KEY variable for backwards compatibility.
        serviceConfig.TWILIO_API_KEY;

    messageServiceSid = serviceConfig.TWILIO_MESSAGE_SERVICE_SID;
  } else {
    // for backward compatibility
    const getConfigOptions = { onlyLocal: Boolean(restrictToOrgFeatures) };

    const hasEncryptedToken = hasConfig(
      "TWILIO_AUTH_TOKEN_ENCRYPTED",
      organization,
      getConfigOptions
    );
    // Note, allows unencrypted auth tokens to be (manually) stored in the db
    // @todo: decide if this is necessary, or if UI/envars is sufficient.
    if (hasEncryptedToken) {
      authToken = obscureSensitiveInformation
        ? "<Encrypted>"
        : await getSecret(
            "TWILIO_AUTH_TOKEN_ENCRYPTED",
            getConfig(
              "TWILIO_AUTH_TOKEN_ENCRYPTED",
              organization,
              getConfigOptions
            ),
            organization
          );
    } else {
      const hasUnencryptedToken = hasConfig(
        "TWILIO_AUTH_TOKEN",
        organization,
        getConfigOptions
      );
      if (hasUnencryptedToken) {
        authToken = obscureSensitiveInformation
          ? "<Hidden>"
          : getConfig("TWILIO_AUTH_TOKEN", organization, getConfigOptions);
      }
    }
    accountSid = hasConfig("TWILIO_ACCOUNT_SID", organization, getConfigOptions)
      ? getConfig("TWILIO_ACCOUNT_SID", organization, getConfigOptions)
      : // Check old TWILIO_API_KEY variable for backwards compatibility.
        getConfig("TWILIO_API_KEY", organization, getConfigOptions);

    messageServiceSid = getConfig(
      "TWILIO_MESSAGE_SERVICE_SID",
      organization,
      getConfigOptions
    );
  }
  return { authToken, accountSid, messageServiceSid };
};

export const getMessageServiceSid = async (
  organization,
  contact,
  messageText
) => {
  // Note organization won't always be available, so we'll need to conditionally look it up based on contact
  if (messageText && /twilioapitest/.test(messageText)) {
    return "fakeSid_MK123";
  }

  const configKey = getConfigKey("twilio");
  const config = getConfig(configKey, organization);
  const { messageServiceSid } = await exports.getServiceConfig(
    config,
    organization
  );
  return messageServiceSid;
};

export const updateConfig = async (
  oldConfig,
  config,
  organization,
  serviceManagerData
) => {
  const { twilioAccountSid, twilioAuthToken, twilioMessageServiceSid } = config;
  if (!twilioAccountSid) {
    throw new Error("twilioAccountSid is required");
  }
  if (
    !twilioMessageServiceSid &&
    (!serviceManagerData || !serviceManagerData.skipOrgMessageService)
  ) {
    throw new Error("twilioMessageServiceSid is required");
  }
  const newConfig = {};

  newConfig.TWILIO_ACCOUNT_SID = twilioAccountSid.substr(0, 64);

  // TODO(lperson) is twilioAuthToken required? -- not for unencrypted
  newConfig.TWILIO_AUTH_TOKEN_ENCRYPTED = twilioAuthToken
    ? await convertSecret(
        "TWILIO_AUTH_TOKEN_ENCRYPTED",
        organization,
        twilioAuthToken
      )
    : twilioAuthToken;
  if (twilioMessageServiceSid) {
    newConfig.TWILIO_MESSAGE_SERVICE_SID =
      twilioMessageServiceSid && twilioMessageServiceSid.substr(0, 64);
  }
  try {
    if (twilioAuthToken && global.TEST_ENVIRONMENT !== "1") {
      // Make sure Twilio credentials work.
      // eslint-disable-next-line new-cap
      const twilio = twilioLibrary.Twilio(twilioAccountSid, twilioAuthToken);
      await twilio.api.accounts.list();
    }
  } catch (err) {
    console.log("twilio.updateConfig client error", err);
    throw new Error("Invalid Twilio credentials");
  }

  return newConfig;
};

export const campaignNumbersEnabled = organization => {
  const inventoryEnabled =
    getConfig("EXPERIMENTAL_PHONE_INVENTORY", organization, {
      truthy: true
    }) ||
    getConfig("PHONE_INVENTORY", organization, {
      truthy: true
    });

  return (
    inventoryEnabled &&
    getConfig("EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS", organization, {
      truthy: true
    })
  );
};

export const manualMessagingServicesEnabled = organization =>
  getConfig(
    "EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE",
    organization,
    { truthy: true }
  );

export const fullyConfigured = async (organization, serviceManagerData) => {
  const { authToken, accountSid } = await getMessageServiceConfig(
    "twilio",
    organization
  );

  if (!(authToken && accountSid)) {
    return false;
  }

  if (
    (serviceManagerData && serviceManagerData.skipOrgMessageService) ||
    // legacy options
    exports.manualMessagingServicesEnabled(organization) ||
    exports.campaignNumbersEnabled(organization)
  ) {
    return true;
  }
  return !!(await exports.getMessageServiceSid(organization));
};

export default {
  syncMessagePartProcessing: !!process.env.JOBS_SAME_PROCESS,
  addServerEndpoints,
  headerValidator,
  convertMessagePartsToMessage,
  sendMessage,
  handleDeliveryReport,
  handleIncomingMessage,
  parseMessageText,
  createMessagingService,
  getPhoneNumbersForService,
  buyNumbersInAreaCode,
  deleteNumbersInAreaCode,
  addNumbersToMessagingService,
  deleteMessagingService,
  clearMessagingServicePhones,
  getTwilio,
  getServiceConfig,
  getMessageServiceSid,
  messageServiceLink,
  updateConfig,
  getMetadata,
  fullyConfigured
};
