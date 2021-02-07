/* eslint-disable no-use-before-define, no-console */
import _ from "lodash";
import Twilio, { twiml } from "twilio";
import urlJoin from "url-join";
import { log } from "../../lib";
import { getConfig } from "../../server/api/lib/config";
import { cacheableData, r } from "../../server/models";
import {
  addServerEndpoints as _addServerEndpoints,
  convertMessagePartsToMessage as _convertMessagePartsToMessage,
  handleDeliveryReport as _handleDeliveryReport,
  handleIncomingMessage as _handleIncomingMessage,
  parseMessageText,
  postMessageSend as _postMessageSend,
  sendMessage as _sendMessage
} from "./lib/laml_api_impl";

// > 1 (i.e. positive) error_codes are reserved for Twilio error codes
// -1 - -MAX_SEND_ATTEMPTS (5): failed send messages
// -100-....: custom local errors
// -101: incoming message with a MediaUrl
// -166: blocked send for profanity message_handler match

export const MAX_SEND_ATTEMPTS = 5;
const MESSAGE_VALIDITY_PADDING_SECONDS = 30;
const MAX_TWILIO_MESSAGE_VALIDITY = 14400;
const TWILIO_SKIP_VALIDATION = getConfig("TWILIO_SKIP_VALIDATION");
const BULK_REQUEST_CONCURRENCY = 5;
const MAX_NUMBERS_PER_BUY_JOB = getConfig("MAX_NUMBERS_PER_BUY_JOB") || 100;

export const name = "twilio";

export const getMessageReportPath = () => "twilio-message-report";

export async function getTwilio(organization) {
  const {
    authToken,
    accountSid
  } = await cacheableData.organization.getTwilioAuth(organization);
  if (accountSid && authToken) {
    return Twilio(accountSid, authToken); // eslint-disable-line new-cap
  }
  return null;
}

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
    const { authToken } = await cacheableData.organization.getTwilioAuth(
      organization
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
  30008: "Message Delivery - Unknown error",
  "-1": "Spoke failed to send the message, usually due to a temporary issue.",
  "-2": "Spoke failed to send the message and will try again.",
  "-3": "Spoke failed to send the message and will try again.",
  "-4": "Spoke failed to send the message and will try again.",
  "-5": "Spoke failed to send the message and will NOT try again.",
  "-133": "Auto-optout (no error)",
  "-166":
    "Internal: Message blocked due to text match trigger (profanity-tagger)",
  "-167": "Internal: Initial message altered (initialtext-guard)"
};

export const addServerEndpoints = expressApp => {
  const messageCallbackUrl =
    process.env.TWILIO_MESSAGE_CALLBACK_URL ||
    global.TWILIO_MESSAGE_CALLBACK_URL;
  const statusCallbackUrl =
    process.env.TWILIO_STATUS_CALLBACK_URL || global.TWILIO_STATUS_CALLBACK_URL;
  const validationFlag = getConfig("TWILIO_VALIDATION");

  _addServerEndpoints({
    expressApp,
    service: exports,
    messageCallbackUrl,
    statusCallbackUrl,
    validationFlag,
    headerValidator,
    twiml
  });
};

export const convertMessagePartsToMessage = messageParts => {
  return _convertMessagePartsToMessage(messageParts, "twilio");
};

export const sendMessage = async (
  message,
  contact,
  trx,
  organization,
  campaign
) => {
  const settings = {
    maxSendAttempts: MAX_SEND_ATTEMPTS,
    messageValidityPaddingSeconds: MESSAGE_VALIDITY_PADDING_SECONDS,
    maxServiceMessageValidity: MAX_TWILIO_MESSAGE_VALIDITY,
    messageServiceValidityPeriod: process.env.TWILIO_MESSAGE_VALIDITY_PERIOD,
    apiTestRegex: /twilioapitest/,
    apiTestTimeoutRegex: /twilioapitesterrortimeout/,
    serviceName: "twilio",
    apiUrl: "api.twilio.com"
  };

  const twilio = await exports.getTwilio(organization);

  return _sendMessage(
    twilio,
    message,
    contact,
    trx,
    organization,
    campaign,
    settings
  );
};

export const postMessageSend = async (
  message,
  contact,
  trx,
  resolve,
  reject,
  err,
  response,
  organization,
  changes,
  settings
) => {
  return _postMessageSend(
    message,
    contact,
    trx,
    resolve,
    reject,
    err,
    response,
    organization,
    changes,
    settings
  );
};

export const handleDeliveryReport = async report => {
  return _handleDeliveryReport(report, "twilio");
};

export const handleIncomingMessage = async message => {
  return _handleIncomingMessage(message, "twilio");
};

/**
 * Create a new Twilio messaging service
 */
export async function createMessagingService(organization, friendlyName) {
  const twilio = await exports.getTwilio(organization);
  const twilioBaseUrl =
    getConfig("TWILIO_BASE_CALLBACK_URL", organization) ||
    getConfig("BASE_URL");
  return await twilio.messaging.services.create({
    friendlyName,
    statusCallback: urlJoin(
      twilioBaseUrl,
      getMessageReportPath(),
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
export async function searchForAvailableNumbers(
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
 * Fetch Phone Numbers assigned to Messaging Service
 */
export async function getPhoneNumbersForService(
  organization,
  messagingServiceSid
) {
  const twilio = await exports.getTwilio(organization);
  return await twilio.messaging
    .services(messagingServiceSid)
    .phoneNumbers.list({ limit: 400 });
}

/**
 * Add bought phone number to a Messaging Service
 */
export async function addNumberToMessagingService(
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
export async function buyNumber(
  organization,
  twilioInstance,
  phoneNumber,
  opts = {}
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
  const messagingServiceSid = opts && opts.messagingServiceSid;
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

export async function bulkRequest(array, fn) {
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
      await buyNumber(organization, twilioInstance, item.phoneNumber, opts);
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
export async function deleteNumber(twilioInstance, phoneSid, phoneNumber) {
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
      service: "twilio",
      allocated_to: null
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
  getMessageReportPath
};
