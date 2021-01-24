/* eslint-disable no-use-before-define, no-console */
import { log } from "../../../lib";
import { getConfig } from "../../../server/api/lib/config";
import { cacheableData, r } from "../../../server/models";

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
