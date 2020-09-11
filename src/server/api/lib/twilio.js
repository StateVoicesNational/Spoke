import Twilio from "twilio";
import { twiml } from "twilio";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import {
  Log,
  Message,
  PendingMessagePart,
  r,
  cacheableData,
  Campaign
} from "../../models";
import { log } from "../../../lib";
import wrap from "../../wrap";
import { saveNewIncomingMessage } from "./message-sending";
import { getConfig } from "./config";
import urlJoin from "url-join";
import _ from "lodash";

// TWILIO error_codes:
// > 1 (i.e. positive) error_codes are reserved for Twilio error codes
// -1 - -MAX_SEND_ATTEMPTS (5): failed send messages
// -100-....: custom local errors
// -101: incoming message with a MediaUrl
// -166: blocked send for profanity message_handler match

const MAX_SEND_ATTEMPTS = 5;
const MESSAGE_VALIDITY_PADDING_SECONDS = 30;
const MAX_TWILIO_MESSAGE_VALIDITY = 14400;
const DISABLE_DB_LOG = getConfig("DISABLE_DB_LOG");
const TWILIO_SKIP_VALIDATION = getConfig("TWILIO_SKIP_VALIDATION");
const BULK_REQUEST_CONCURRENCY = 5;
const MAX_NUMBERS_PER_BUY_JOB = getConfig("MAX_NUMBERS_PER_BUY_JOB") || 100;

async function getTwilio(organization) {
  const {
    authToken,
    accountSid
  } = await cacheableData.organization.getTwilioAuth(organization);
  if (accountSid && authToken) {
    return Twilio(accountSid, authToken);
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
      url: url
    };

    return Twilio.webhook(authToken, options)(req, res, next);
  };
};

export const errorDescriptions = {
  12400: "Internal (Twilio) Failure",
  21211: "Invalid 'To' Phone Number",
  21408: "Attempt to send to disabled region",
  21602: "Message body is required",
  21610: "Attempt to send to unsubscribed recipient",
  21611: "Source number has exceeded max number of queued messages",
  21612: "Unreachable via SMS or MMS",
  21614: "Invalid mobile number",
  21621: "From-number is not enabled for MMS (note 800 nums can't send MMS)",
  30001: "Queue overflow",
  30002: "Account suspended",
  30003: "Unreachable destination handset",
  30004: "Message blocked",
  30005: "Unknown destination handset",
  30006: "Landline or unreachable carrier",
  30007: "Message Delivery - Carrier violation",
  30008: "Message Delivery - Unknown error",
  "-1": "Spoke failed to send the message and will try again.",
  "-2": "Spoke failed to send the message and will try again.",
  "-3": "Spoke failed to send the message and will try again.",
  "-4": "Spoke failed to send the message and will try again.",
  "-5": "Spoke failed to send the message and will NOT try again.",
  "-133": "Auto-optout (no error)",
  "-166":
    "Internal: Message blocked due to text match trigger (profanity-tagger)",
  "-167": "Internal: Initial message altered (initialtext-guard)"
};

function addServerEndpoints(expressApp) {
  expressApp.post(
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
      const resp = new twiml.MessagingResponse();
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
      const resp = new twiml.MessagingResponse();
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(resp.toString());
    })
  );

  expressApp.post("/twilio-message-report/:orgId?", ...messageReportHooks);
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
  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    error_code: null,
    service_id: firstPart.service_id,
    // will be set during cacheableData.message.save()
    // campaign_contact_id: lastMessage.campaign_contact_id,
    messageservice_sid: serviceMessages[0].MessagingServiceSid,
    service: "twilio",
    send_status: "DELIVERED"
  });
}

const mediaExtractor = new RegExp(/\[\s*(http[^\]\s]*)\s*\]/);

function parseMessageText(message) {
  const text = message.text || "";
  const params = {
    body: text.replace(mediaExtractor, "")
  };
  // Image extraction
  const results = text.match(mediaExtractor);
  if (results) {
    params.mediaUrl = results[1];
  }
  return params;
}

async function getMessagingServiceSid(
  organization,
  contact,
  message,
  campaign
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
      campaign || (await cacheableData.campaign.load(contact.campaign_id));
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

async function sendMessage(message, contact, trx, organization, campaign) {
  const twilio = await getTwilio(organization);
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
  const messagingServiceSid = await getMessagingServiceSid(
    organization,
    contact,
    message,
    campaign
  );

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

    changes.messageservice_sid = messagingServiceSid;

    const messageParams = Object.assign(
      {
        to: message.contact_number,
        body: message.text,
        messagingServiceSid
      },
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
      cacheableData.campaignContact.updateStatus({
        ...contact,
        messageservice_sid: changesToSave.messageservice_sid
      })
    ])
      .then((newMessage, cacheResult) => {
        resolve({
          ...message,
          ...changesToSave
        });
      })
      .catch(err => {
        console.error(
          "Failed message and contact update on twilio postMessageSend",
          err
        );
        reject(err);
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

    if (!DISABLE_DB_LOG) {
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
      await cacheableData.message.deliveryReport({
        contactNumber: report.To,
        userNumber: report.From,
        messageSid: report.MessageSid,
        service: "twilio",
        messageServiceSid: report.MessagingServiceSid,
        newStatus: messageStatus === "delivered" ? "DELIVERED" : "ERROR",
        errorCode: Number(report.ErrorCode || 0) || 0
      });
    }
  }
}

async function handleIncomingMessage(message) {
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
  if (message.MediaUrl0 && (!DISABLE_DB_LOG || getConfig("LOG_MEDIA_URL"))) {
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
 * Create a new Twilio messaging service
 */
async function createMessagingService(organization, friendlyName) {
  const twilio = await getTwilio(organization);
  const twilioBaseUrl = getConfig("TWILIO_BASE_CALLBACK_URL", organization);
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
 * Fetch Phone Numbers assigned to Messaging Service
 */
async function getPhoneNumbersForService(organization, messagingServiceSid) {
  const twilio = await getTwilio(organization);
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
async function buyNumber(organization, twilioInstance, phoneNumber, opts = {}) {
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
async function buyNumbersInAreaCode(organization, areaCode, limit, opts = {}) {
  const twilioInstance = await getTwilio(organization);
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

async function addNumbersToMessagingService(
  organization,
  phoneSids,
  messagingServiceSid
) {
  const twilioInstance = await getTwilio(organization);
  return await bulkRequest(phoneSids, async phoneNumberSid =>
    twilioInstance.messaging
      .services(messagingServiceSid)
      .phoneNumbers.create({ phoneNumberSid })
  );
}

async function deleteMessagingService(organization, messagingServiceSid) {
  const twilioInstance = await getTwilio(organization);
  console.log("Deleting messaging service", messagingServiceSid);
  return twilioInstance.messaging.services(messagingServiceSid).remove();
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
  addNumbersToMessagingService,
  deleteMessagingService
};
