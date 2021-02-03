/* eslint-disable no-use-before-define, no-console */
import { log } from "../../../lib";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { getConfig } from "../../../server/api/lib/config";
import {
  cacheableData,
  Log,
  Message,
  PendingMessagePart,
  r
} from "../../../server/models";
import { saveNewIncomingMessage } from "../message-sending";
import wrap from "../../../server/wrap";

const DISABLE_DB_LOG = getConfig("DISABLE_DB_LOG");

export const addServerEndpoints = ({
  expressApp,
  serviceName,
  messageCallbackUrl,
  statusCallbackUrl,
  validationFlag,
  headerValidator,
  twiml
}) => {
  expressApp.post(
    `/${serviceName}/:orgId?`,
    headerValidator(messageCallbackUrl),
    wrap(async (req, res) => {
      try {
        await handleIncomingMessage(req.body, serviceName);
      } catch (ex) {
        log.error(ex);
      }
      const resp = new twiml.MessagingResponse();
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(resp.toString());
    })
  );

  const messageReportHooks = [];
  if (statusCallbackUrl || validationFlag) {
    messageReportHooks.push(headerValidator(statusCallbackUrl));
  }
  messageReportHooks.push(
    wrap(async (req, res) => {
      try {
        const body = req.body;
        await handleDeliveryReport(body, serviceName);
      } catch (ex) {
        log.error(ex);
      }
      const resp = new twiml.MessagingResponse();
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(resp.toString());
    })
  );

  expressApp.post(
    `/${serviceName}-message-report/:orgId?`,
    ...messageReportHooks
  );
};

const getMessagingServiceSid = async (
  organization,
  contact,
  message,
  _campaign
) => {
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
};

const mediaExtractor = new RegExp(/\[\s*(http[^\]\s]*)\s*\]/);

export const parseMessageText = message => {
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
};

export const sendMessage = async (
  serviceClient,
  message,
  contact,
  trx,
  organization,
  campaign,
  settings = {}
) => {
  const {
    messageValidityPaddingSeconds,
    maxServiceMessageValidity,
    messageServiceValidityPeriod,
    apiTestRegex,
    apiTestTimeoutRegex,
    serviceName,
    apiUrl
  } = settings;
  const APITEST = apiTestRegex.test(message.text);
  if (!serviceClient && !APITEST) {
    log.warn(
      "cannot actually send SMS message -- message service is not fully configured:",
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
    if (message.service !== serviceName) {
      log.warn(`Message not marked as a ${serviceName} message`, message.id);
    }

    let effectiveMessageServiceValidityPeriod = messageServiceValidityPeriod;
    if (message.send_before) {
      // the message is valid no longer than the time between now and
      // the send_before time, less 30 seconds
      // we subtract the MESSAGE_VALIDITY_PADDING_SECONDS seconds to allow time for the message to be sent by
      // a downstream service
      const messageValidityPeriod =
        Math.ceil((message.send_before - Date.now()) / 1000) -
        messageValidityPaddingSeconds;

      if (messageValidityPeriod < 0) {
        // this is an edge case
        // it means the message arrived in this function already too late to be sent
        // pass the negative validity period to ${serviceName}, and let ${serviceName} respond with an error
      }

      if (effectiveMessageServiceValidityPeriod) {
        effectiveMessageServiceValidityPeriod = Math.min(
          messageServiceValidityPeriod,
          messageValidityPeriod,
          maxServiceMessageValidity
        );
      } else {
        effectiveMessageServiceValidityPeriod = Math.min(
          messageValidityPeriod,
          maxServiceMessageValidity
        );
      }
    }
    const changes = {};

    changes.messageservice_sid = messagingServiceSid;

    const messageParams = Object.assign(
      {
        to: message.contact_number,
        body: message.text
      },
      messagingServiceSid ? { messagingServiceSid } : {},
      effectiveMessageServiceValidityPeriod
        ? { validityPeriod: effectiveMessageServiceValidityPeriod }
        : {},
      parseMessageText(message)
    );

    console.log(`${serviceName}Message`, messageParams);
    if (APITEST) {
      let fakeErr = null;
      let fakeResponse = null;
      if (apiTestTimeoutRegex.test(message.text)) {
        fakeErr = {
          status: "ESOCKETTIMEDOUT",
          message: `FAKE TRIGGER(apierrortest) Unable to reach host: "${apiUrl}"`
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
        changes,
        settings
      );
    } else {
      serviceClient.messages.create(messageParams, (err, response) => {
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
  settings = {}
) => {
  const { maxSendAttempts, serviceName } = settings;
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
      if (message.error_code <= -1 * maxSendAttempts) {
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
      service: serviceName,
      sent_at: new Date()
    };
    Promise.all([
      updateQuery.update(changesToSave),
      cacheableData.campaignContact.updateStatus({
        ...contact,
        messageservice_sid: changesToSave.messageservice_sid
      })
    ])
      .then(() => {
        resolve({
          ...message,
          ...changesToSave
        });
      })
      .catch(caught => {
        console.error(
          `Failed message and contact update on ${serviceName} postMessageSend`,
          caught
        );
        reject(caught);
      });
  }
};

export const convertMessagePartsToMessage = (
  messageParts,
  messagingServiceName
) => {
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
    service: messagingServiceName,
    send_status: "DELIVERED",
    user_id: null
  });
};

export const handleIncomingMessage = async (message, messagingServiceName) => {
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
    service: messagingServiceName,
    service_id: MessageSid,
    parent_id: null,
    service_message: JSON.stringify(message),
    user_number: userNumber,
    contact_number: contactNumber
  });
  if (process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS) {
    // Handle the message directly and skip saving an intermediate part
    const finalMessage = await convertMessagePartsToMessage(
      [pendingMessagePart],
      messagingServiceName
    );
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
};

export const handleDeliveryReport = async (report, messagingServiceName) => {
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
        service: messagingServiceName,
        messageServiceSid: report.MessagingServiceSid,
        newStatus: messageStatus === "delivered" ? "DELIVERED" : "ERROR",
        errorCode: Number(report.ErrorCode || 0) || 0
      });
    }
  }
};
