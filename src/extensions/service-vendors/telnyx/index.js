/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
/* eslint-disable import/prefer-default-export */
import Telnyx from "telnyx"
import urlJoin from "url-join";
import { getLastMessage } from "../message-sending";
import {
  Message,
  PendingMessagePart,
  r,
  cacheableData
} from "../../../server/models";
import uuid from "uuid";
import wrap from "../../../server/wrap";
import { log } from "../../../lib";
import { getMessageServiceConfig, getConfigKey } from "../service_map";
import { saveNewIncomingMessage, parseMessageText } from "../message-sending";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import errors from './errors.json'

const ENABLE_DB_LOG = getConfig("ENABLE_DB_LOG");
const MAX_SEND_ATTEMPTS = 5;
const TELNYX_SKIP_VALIDATION = getConfig("TELNYX_SKIP_VALIDATION");
const TELNYX_API_KEY = getConfig('TELNYX_API_KEY')
const TELNYX_PUB_KEY = getConfig('TELNYX_PUBLIC_KEY')
// const TELNYX_MESSAGING_PROFILE = getConfig('TELNYX_MESSAGING_PROFILE')
const JOBS_SAME_PROCESS = getConfig("JOBS_SAME_PROCESS")

let telnyx = null;
if (TELNYX_API_KEY) {
  telnyx = Telnyx(TELNYX_API_KEY)
}

export const getMetadata = () => ({
  supportsOrgConfig: true,
  supportsCampaignConfig: false,
  name: "telnyx"
});

/**
 * Validate that the message came from Telnyx before proceeding.
 */
const headerValidator = () => {
  if (!!TELNYX_SKIP_VALIDATION) return (req, res, next) => next();

  return async (req, res, next) => {
    try {
      telnyx.webhooks.constructEvent(
        // webhook data needs to be passed raw for verification
        JSON.stringify(req.body, null, 2),
        req.header('telnyx-signature-ed25519'),
        req.header('telnyx-timestamp'),
        TELNYX_PUB_KEY
      );
    } catch (e) {
      // If `constructEvent` throws an error, respond with the message and return.
      console.log('Error', e.message);

      return res.status(400).send('Webhook Error:' + e.message);
    }
  };
};

// TODO: what's the cost data?
// export function costData(organization, userNumber) {
// }

/**
 * Get the error description from the errors json
 * @param {number} errorCode 
 * @returns 
 */
export function errorDescription(errorCode) {
  // TODO: add fallback for unknown error here...
  return {
    code: errorCode,
    description: errors[errorCode.toString()].title || "Telnyx error",
    link: `https://developers.telnyx.com/docs/errors/`
  };
}


export function addServerEndpoints(addPostRoute) {
  if (TELNYX_API_KEY) {
    addPostRoute(
      "/telnyx",
      // TODO: setup these env vars
      // headerValidator(getConfig('TELNYX_MESSAGE_CALLBACK_URL')),
      /**
       * req: {meta, data} //TODO: what are these objects
       */
      wrap(async (req, res) => {
        try {
          // telnyx
          // TODO: telnyx handle incoming
          // const messageId = await nexmo.handleIncomingMessage(req.body);
          //TODO: reconcile two ids: req.body.data.id and req.body.data.payload.id
          //has {}
          const eventType = req.body.data.event_type;
          if (eventType == 'message.received') {
            await handleIncomingMessage(req.body.data.payload);
          } else if (eventType) {
            console.log(`telnyx event type: ${eventType} not configured`)
          }
          // res.send(messageId);
          res.send('done')
        } catch (ex) {
          log.error(ex);
          res.send("done");
        }
      })
    )

    const messageReportHooks = [];
    messageReportHooks.push(
      headerValidator()
    )
    messageReportHooks.push(
      wrap(async (req, res) => {
        try {
          const body = req.body;
          // TODO: implement this
          // await handleDeliveryReport(body);
        } catch (ex) {
          log.error(ex);
        }
        // TODO: how to respond to the webook?
        // const resp = new twilioLibrary.twiml.MessagingResponse();
        // res.writeHead(200, { "Content-Type": "text/xml" });
        // res.end(resp.toString());
      })
    );

    addPostRoute("/telnyx-message-report", ...messageReportHooks);

  }
}


// https://developers.telnyx.com/openapi/messaging/tag/Messages/#tag/Messages/operation/createMessage
export async function sendMessage({
  message,
  contact,
  trx,
  organization,
  campaign,
  serviceManagerData
}) {
  console.log(
    "telnyx sendMessage",
    message && message.id,
    contact && contact.id
  );
  // let userNumber =
  //   (serviceManagerData && serviceManagerData.user_number) ||
  //   message.user_number;

  // Note organization won't always be available, so then contact can trace to it
  // eslint-disable-next-line camelcase
  const { messagingProfileId: messaging_profile_id } = await getMessageServiceSid(organization)


  if (message.service !== 'telnyx') {
    log.warn('Message not marked as a telnyx message', message.id)
  }
  if (!messaging_profile_id) {
    log.error('Telnyx service vendor failed to get messaging_profile_id')
  }

  const changes = {
    service: "telnyx",
    messageservice_sid: messaging_profile_id,
    send_status: "SENT",
    sent_at: new Date(),
    // error_code: errorCode ? errorCode[1] : null
  };

  // TODO: set this up
  const additionalMessageParams = parseMessageText(message);
  // TODO: 
  // additionalMessageParams.auto_detect
  // additionalMessageParams.media_urls
  // additionalMessageParams.subject
  // additionalMessageParams.type
  // additionalMessageParams.use_profile_webhooks
  // additionalMessageParams.webhook_failover_url
  // additionalMessageParams.webhook_url
  // if (
  //   serviceManagerData &&
  //   serviceManagerData.forceMms &&
  //   !additionalMessageParams.mediaUrl
  // ) {
  //   // https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource
  //   additionalMessageParams.sendAsMms = true; // currently 'in beta'
  //   // additionalMessageParams.mediaUrl = [];
  // }

  const messageParams = {
    to: message.contact_number,
    text: message.text,
    messaging_profile_id: messaging_profile_id
    // TODO: does this matter & how to get them?
    // 'media_urls': [ 
    //   //     'https://picsum.photos/500.jpg'
    //   //   ]
  }

  // userNumber ? { from: userNumber } : {},
  // messagingServiceSid ? { messaging_profile_id: messagingServiceSid } : {},
  // additionalMessageParams
  // )

  let response
  let err
  try {
    const result = await telnyx.messages.create(messageParams)
    response = result.data
    //TODO: remove
    console.log(response);
  } catch (err) {
    err = err
  }
  await postMessageSend(
    message,
    contact,
    trx,
    err,
    response,
    organization,
    changes
  );
}

export async function postMessageSend(
  message,
  contact,
  trx,
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
    // changesToSave.service_id = response.sid;
    //TODO: is this the id for the incoming message?
    changesToSave.service_id = response.id;
    // TODO: test if this can be an array
    hasError = response.errors.length
    // hasError = !!response.error_code;
    if (hasError) {
      // changesToSave.error_code = response.error_code;
      const code = err && err.raw && err.raw.errors[0] && err.raw.errors[0].code
      code ? parseInt(code) : 0
      changesToSave.error_code = code
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
      // TODO: this wont work with an array of
      // if (message.error_code <= -MAX_SEND_ATTEMPTS) {
      //   changesToSave.send_status = "ERROR";
      // }
      // // decrement error code starting from zero
      // changesToSave.error_code = Number(message.error_code || 0) - 1;
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


    //TODO: need to grab & save the carrier information somewhere

    await updateQuery.update(changesToSave);
    await contactUpdateQuery()

    console.log("Saved message error status", changesToSave, err);

    const status = err || (response ? new Error(JSON.stringify(response)) : new Error("Encountered unknown error"))

    return status
  } else {
    changesToSave = {
      ...changesToSave,
      send_status: "SENT",
      service: "telnyx",
      sent_at: new Date()
    };
    try {
      await updateQuery.update(changesToSave)
      await cacheableData.campaignContact.updateStatus(
        contact,
        undefined,
        // changesToSave.messageservice_sid || changesToSave.user_number
      )
      return { ...message, ...changesToSave }
    } catch (err) {

    }
    console.error(
      "Failed message and contact update on telnyx postMessageSend",
      err
    );
    return err
  }
}

// TODO: test this to see if it works with telnyx
// async function convertMessagePartsToMessage(messageParts) {
//   const firstPart = messageParts[0];
//   const userNumber = firstPart.user_number;
//   const contactNumber = firstPart.contact_number;
//   const serviceMessages = messageParts.map(part =>
//     JSON.parse(part.service_message)
//   );
//   const text = serviceMessages
//     .map(serviceMessage => serviceMessage.Body)
//     .join("")
//     .replace(/\0/g, ""); // strip all UTF-8 null characters (0x00)
//   const media = serviceMessages
//     .map(serviceMessage => {
//       const mediaItems = [];
//       for (let m = 0; m < Number(serviceMessage.NumMedia); m++) {
//         mediaItems.push({
//           type: serviceMessage[`MediaContentType${m}`],
//           url: serviceMessage[`MediaUrl${m}`]
//         });
//       }
//       return mediaItems;
//     })
//     .reduce((acc, val) => acc.concat(val), []); // flatten array
//   return new Message({
//     contact_number: contactNumber,
//     user_number: userNumber,
//     is_from_contact: true,
//     text,
//     media,
//     error_code: null,
//     service_id: firstPart.service_id,
//     // will be set during cacheableData.message.save()
//     // campaign_contact_id: lastMessage.campaign_contact_id,
//     messageservice_sid: serviceMessages[0].MessagingServiceSid,
//     service: "telnyx",
//     send_status: "DELIVERED",
//     user_id: null
//   });
// }

/**
 * Process a message from Telnyx
 * @param {*} message 
 * message.direction string
 * message.from {carrier: 'Verizon Wireless', line_type: 'Wireless', phone_number: '+15412803322'}
 * message.to 0:{carrier: 'Telnyx', line_type: 'Wireless', phone_number: '+13642148507', status: 'webhook_delivered'}
 * message.text: string
 * message.messaging_profile_id: string
 */
export async function handleIncomingMessage(message) {
  if (
    !message.hasOwnProperty("id") ||
    !message.hasOwnProperty("direction") ||
    !message.hasOwnProperty("from") ||  // {}
    !message.hasOwnProperty("to") || //this is an array
    !message.hasOwnProperty("text") //
  ) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`);
  }
  const { id, direction, from: fromPhone, to: toPhone, text, messaging_profile_id } = message;
  const from = fromPhone.phone_number
  const to = toPhone[0].phone_number // not sure why this is an array..?
  const contactNumber = getFormattedPhoneNumber(from);
  const userNumber = to ? getFormattedPhoneNumber(to) : "";

  // const pendingMessagePart = new PendingMessagePart({
  //   service: "telnyx",
  //   service_id: sms_id, // what is this used for?
  //   parent_id: null, // why is this null? - test to see if telnyx builds the message parts automatically
  //   // service_message: body,
  //   service_message: JSON.stringify(message),
  //   user_number: userNumber,
  //   contact_number: contactNumber
  // });

  const finalMessage = new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    // media: //TODO: how to get this?
    error_code: null,
    service_id: id, // what is this used for?
    messageservice_sid: messaging_profile_id,
    service: "telnyx",
    send_status: "DELIVERED",
    user_id: null
  })

  await saveNewIncomingMessage(finalMessage);

  // if (JOBS_SAME_PROCESS) {
  //   // Handle the message directly and skip saving an intermediate part
  //   const finalMessage = await convertMessagePartsToMessage([
  //     pendingMessagePart
  //   ]);
  //   console.log("Contact reply", finalMessage, pendingMessagePart);
  //   if (finalMessage) {
  //     if (message.spokeCreatedAt) {
  //       finalMessage.created_at = message.spokeCreatedAt;
  //     }
  //     await saveNewIncomingMessage(finalMessage);
  //   }
  // } else {
  //   // If multiple processes, just insert the message part and let another job handle it
  //   await r.knex("pending_message_part").insert(pendingMessagePart);
  // }

  // store mediaurl data in Log, so it can be extracted manually
  if (ENABLE_DB_LOG) {
    await Log.save({
      message_sid: id,
      body: JSON.stringify(message),
      error_code: -101,
      from_num: from || null,
      to_num: to || null
    });
  }
}


// export async function buyNumbersInAreaCode(organization, areaCode, limit) {
// const rows = [];
// for (let i = 0; i < limit; i++) {
//   const last4 = limit.toString().padStart(4, "0");
//   rows.push({
//     organization_id: organization.id,
//     area_code: areaCode,
//     phone_number: `+1${areaCode}XYZ${last4}`,
//     service: "fakeservice",
//     service_id: uuid.v4()
//   });
// }

// add some latency
// await new Promise(resolve => setTimeout(resolve, limit * 25));
// await r.knex("owned_phone_number").insert(rows);
// return limit;
// }

// export async function deleteNumbersInAreaCode(organization, areaCode) {
// const numbersToDelete = (
//   await r
//     .knex("owned_phone_number")
//     .select("service_id")
//     .where({
//       organization_id: organization.id,
//       area_code: areaCode,
//       service: "fakeservice",
//       allocated_to: null
//     })
// ).map(row => row.service_id);
// const count = numbersToDelete.length;
// // add some latency
// await new Promise(resolve => setTimeout(resolve, count * 25));
// await r
//   .knex("owned_phone_number")
//   .del()
//   .whereIn("service_id", numbersToDelete);
// return count;
// }

// Does a lookup for carrier and optionally the contact name
// export async function getContactInfo({
// organization,
// contactNumber,
// Boolean: maybe twilio-specific?
// lookupName
// }) {
// if (!contactNumber) {
//   return {};
// }
// const contactInfo = {
//   carrier: "FakeCarrier",
//   // -1 is a landline, 1 is a mobile number
//   // we test against one of the lower digits to randomly
//   // but deterministically vary on the landline
//   status_code: contactNumber[11] === "2" ? -1 : 1
// };
// if (lookupName) {
//   contactInfo.lookup_name = `Foo ${parseInt(Math.random() * 1000)}`;
// }
// return contactInfo;
// }

export async function createMessagingService(organization, friendlyName) {
  console.log("telnyx.createMessagingService", organization.id, friendlyName);
  // TODO: test where does this name come from?

  const telnyxBaseUrl =
    getConfig("TELNYX_BASE_CALLBACK_URL", organization) ||
    getConfig("BASE_URL");

  const result = await telnyx.messagingProfiles.create({
    name: friendlyName,
    webhook_url: urljoin(telnyxBaseUrl, "telnyx-message-report", organization.id.toString()),
    number_pool_setting: {
      geomatch: true, // TODO: verify this
      long_code_weight: 50, // TODO: verify this
      skip_unhealthy: true, // TODO: verify this
      sticky_sender: true, // TODO: verify this
      toll_free_weight: 0 // TODO: verify this
    },
    url_shortener_settings: null // TODO: this may improve deliverability
  })
  return result
}

export async function updateConfig(
  oldConfig,
  config,
  organization,
  serviceManagerData
) {
  const { messagingProfileId } = config

  if (!messagingProfileId) {
    throw new Error('messagingProfileId is required')
  }

  const newConfig = {}
  newConfig.TELNYX_MESSAGING_PROFILE_ID = messagingProfileId

  return newConfig

}

export const getServiceConfig = async (
  serviceConfig,
  organization,
  options = {}
) => {
  let messagingProfileId;
  if (serviceConfig) {
    messagingProfileId = serviceConfig.TELNYX_MESSAGING_PROFILE_ID
  } else {
    //   // for backward compatibility

  }
  return { messagingProfileId }
}

export const getMessageServiceSid = async (
  organization,
  contact,
  messageText
) => {

  const configKey = getConfigKey("telnyx");
  const config = getConfig(configKey, organization);
  const messageServiceSid = await getServiceConfig(
    config,
    organization
  );
  return messageServiceSid;
};

/**
 * Used to verify the organization is fully setup before a campaign can start
 * @param {*} organization 
 * @param {*} serviceManagerData 
 * @returns 
 */
export const fullyConfigured = async (organization, serviceManagerData) => {
  console.log('telnyx::fullConfigured', { organization })
  const result = await getMessageServiceSid(organization)
  if (result.messagingProfileId) {
    return true
  }
  return false

};


export default {
  // buyNumbersInAreaCode,
  createMessagingService,
  // convertMessagePartsToMessage,
  // deleteNumbersInAreaCode,
  getMetadata,
  handleIncomingMessage,
  fullyConfigured,
  sendMessage,
  updateConfig,
};
