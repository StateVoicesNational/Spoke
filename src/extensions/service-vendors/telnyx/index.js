/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
/* eslint-disable import/prefer-default-export */
import Telnyx from "telnyx"
import {
  Message,
  r,
  cacheableData
} from "../../../server/models";
import wrap from "../../../server/wrap";
import { log } from "../../../lib";
// import { getConfigKey } from "../service_map";
import { saveNewIncomingMessage, parseMessageText } from "../message-sending";
import { getConfig } from "../../../server/api/lib/config";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import errors from './errors.json'

const ENABLE_DB_LOG = getConfig("ENABLE_DB_LOG");
const TELNYX_SKIP_VALIDATION = getConfig("TELNYX_SKIP_VALIDATION");
const TELNYX_API_KEY = getConfig('TELNYX_API_KEY')
const TELNYX_PUB_KEY = getConfig('TELNYX_PUBLIC_KEY')

let telnyx = null;
if (TELNYX_API_KEY) {
  telnyx = Telnyx(TELNYX_API_KEY)
}

export const getMetadata = () => ({
  supportsOrgConfig: false,
  supportsCampaignConfig: false,
  name: "telnyx"
});

/**
 * Validate that the message came from Telnyx before proceeding.
 * @param {*} req - express request
 */
const headerValidator = (req) => {
  if (!!TELNYX_SKIP_VALIDATION) return;
  telnyx.webhooks.constructEvent(
    // webhook data needs to be passed raw for verification
    JSON.stringify(req.body, null, 2),
    req.header('telnyx-signature-ed25519'),
    req.header('telnyx-timestamp'),
    TELNYX_PUB_KEY
  );
};

export const costData = (organization, userNumber) => ({
  source: "https://portal.telnyx.com",
  lastChecked: "2023-07-18",
  mmsMessage: 0.012,
  smsSegment: 0.0009
});

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

const webhooks = {
  "message.sent": handleDeliveryReport,
  "message.failed": handleDeliveryReport,
  "message.received": handleIncomingMessage,
  "message.finalized": handleDeliveryReport
};


export function addServerEndpoints(addPostRoute) {
  if (TELNYX_API_KEY) {
    addPostRoute(
      "/telnyx/:orgId?",
      wrap(async (req, res) => {
        try {
          headerValidator(req)
          const eventType = req.body.data.event_type;
          const payload = req.body.data.payload
          if (eventType) {
            if (webhooks[eventType]) {
              await webhooks[eventType](payload, req.params);
            }
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end('{"success": true}');
        } catch (ex) {
          log.error(ex);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end()
        }
      })
    )

  }
}

// https://developers.telnyx.com/openapi/messaging/tag/Messages/#tag/Messages/operation/createMessage
// TODO: if this errors there error shows as undefined with no error log
export async function sendMessage({
  message,
  contact,
  trx,
  organization,
  campaign,
  serviceManagerData
}) {
  log.debug({
    message: "telnyx sendMessage",
    campaign,
    content: message,
    contact, 
  });
  // eslint-disable-next-line camelcase
  // applicationId will probably come from config, unless serviceManager is doing something fancy
  const messaging_profile_id = serviceManagerData && serviceManagerData.messageservice_sid

  // const { messagingProfileId: messaging_profile_id } = await getMessageServiceSid(organization)


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
  };

  const additionalMessageParams = parseMessageText(message);

  const messageParams = {
    to: message.contact_number,
    text: message.text,
    messaging_profile_id: messaging_profile_id,
  }

  // TODO: test this
  if (additionalMessageParams.mediaUrl) {
    messageParams.media_urls = [additionalMessageParams.mediaUrl];
  }

  let response
  let err
  try {
    const result = await telnyx.messages.create(messageParams)
    response = result.data
    await postMessageSend(
      message,
      contact,
      trx,
      err,
      response,
      organization,
      changes
    );
  } catch (err) {
    err = err
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
  log.debug("postMessageSend", message, changes, response, err);
  let hasError = false;

  const handleError = (err) => {
    const code = err && err.raw && err.raw.errors[0] && err.raw.errors[0].code
    changesToSave.error_code = code ? parseInt(code) : 0
    changesToSave.send_status = "ERROR";
  }
  if (err) {
    hasError = true;
  }
  if (response) {
    changesToSave.service_id = response.id;
    hasError = response.errors.length > 0
  }
  if (hasError) {
    handleError(err)
  }
  let updateQuery = r.knex("message").where("id", message.id);
  if (trx) {
    updateQuery = updateQuery.transacting(trx);
  }

  if (hasError) {
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

    await updateQuery.update(changesToSave);
    await contactUpdateQuery

    log.debug("Saved message error status", changesToSave, err);

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
        changesToSave.messageservice_sid
      )
      if (response && response.to && response.to.length > 0) {
        await handleOrganizationContact({ organizationId: organization.id, contactNumber: message.contact_number, to: response.to[0] })
      }
      return { ...message, ...changesToSave }
    } catch (err) {

    }
    log.error(
      `Failed message and contact update on telnyx postMessageSend`, err
    );
    return err
  }
}

const parseMessage = (message) => {
  const { id, from: fromPhone, to: toPhone, text, messaging_profile_id: messageservice_sid } = message;
  const from = fromPhone.phone_number
  const to = toPhone[0].phone_number // not sure why this is an array..?
  const contact_number = getFormattedPhoneNumber(from);
  const user_number = to ? getFormattedPhoneNumber(to) : "";
  return { id, contact_number, messageservice_sid, text, user_number }
}

/**
 * Process a message from Telnyx
 * @param {*} message 
 * message.direction string
 * message.from {carrier: 'Verizon Wireless', line_type: 'Wireless', phone_number: '+15412803322'}
 * message.to 0:{carrier: 'Telnyx', line_type: 'Wireless', phone_number: '+13642148507', status: 'webhook_delivered'}
 * message.text: string
 * message.messaging_profile_id: string
 */
export async function handleIncomingMessage(message, { orgId }) {
  if (
    !message.hasOwnProperty("id") ||
    !message.hasOwnProperty("direction") ||
    !message.hasOwnProperty("from") ||  // {}
    !message.hasOwnProperty("to") || //this is an array
    !message.hasOwnProperty("text") //
  ) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`);
  }
  const { id, contact_number, messageservice_sid, text, user_number } = parseMessage(message)

  const finalMessage = new Message({
    contact_number,
    user_number,
    is_from_contact: true,
    text,
    // media: //TODO: how to get this?
    error_code: null,
    service_id: id, // what is this used for?
    messageservice_sid,
    service: "telnyx",
    send_status: "DELIVERED",
    user_id: null
  })

  await saveNewIncomingMessage(finalMessage);

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

/**
 * Write carrier information to organization_contact table
 * @param {*} to 
 *  {
     phone_number: '+17177613265',
     status: 'queued',
     carrier: 'VERIZON PENNSYLVANIA, INC.',
     line_type: 'Wireline'
   }
 */
async function handleOrganizationContact({ organizationId, contactNumber, to }) {
  try {
    log.debug('handle organization concat called')
    const organizationContact = await cacheableData.organizationContact.query({
      organizationId,
      contactNumber
    })

    // STATUS_CODE
    // -1 = landline
    // 1 = mobile or voip number
    // positive statuses should mean 'textable' and negative should mean untextable
    const status_code = to.line_type === 'Wireless' ? 1 : -1

    const orgContact = organizationContact ? organizationContact : {}
    orgContact.organization_id = organizationId
    orgContact.contact_number = to.phone_number
    orgContact.carrier = to.carrier
    orgContact.status_code = status_code
    orgContact.service = 'telnyx'

    if (!organizationContact) {
      await cacheableData.organizationContact.save(orgContact);
    } else {
      await cacheableData.organizationContact.save(orgContact, {
        update: true
      });
    }
  } catch (err) {
    console.error(err)
  }
}


/**
 * Parse the result of the message being sent
 * @param {*} message
 */
export async function handleDeliveryReport(message, { orgId }) {
  log.debug('telnyx.handleDeliveryReport', { message })

  const { id, contact_number, messageservice_sid, text, user_number } = parseMessage(message)
  const deliveryReport = {
    contactNumber: contact_number,
    userNumber: user_number,
    messageSid: id,
    service: "telnyx",
    messageServiceSid: messageservice_sid,
    newStatus: message.errors.length > 0 ? "ERROR" : "DELIVERED",
  };

  if (message.errors.length > 0) {
    deliveryReport.errorCode = message.errors[0].code
  }
  await cacheableData.message.deliveryReport(deliveryReport);
}

// FUTURE: this has not been implemented
/**
 * Create a messaging profile id within Telnyx
 */
export async function createMessagingService(organization, friendlyName) {
  //where does this name come from?
  log.debug({ message: "telnyx.createMessagingService", organization: organization, friendlyName });

  const telnyxBaseUrl =
    getConfig("TELNYX_BASE_CALLBACK_URL", organization) ||
    getConfig("BASE_URL");

  const result = await telnyx.messagingProfiles.create({
    name: friendlyName,
    webhook_url: urljoin(telnyxBaseUrl, "telnyx-message-report", organization.id.toString()),
    number_pool_setting: {
      geomatch: true, // FUTURE: verify this
      long_code_weight: 50, // FUTURE: verify this
      skip_unhealthy: true, // FUTURE: verify this
      sticky_sender: true, // FUTURE: verify this
      toll_free_weight: 0 // FUTURE: verify this
    },
    url_shortener_settings: null // TODO: this may improve deliverability
  })
  return result
}

/**
 * This is triggered when the organization configurion changes
 */
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

/**
 * Returned to the react component for the organization config
 */
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

/**
 * Called from various places to get the messaging profile id 
 */
// export const getMessageServiceSid = async (
//   organization,
//   contact,
//   messageText
// ) => {

//   const configKey = getConfigKey("telnyx");
//   const config = getConfig(configKey, organization);
//   const messageServiceSid = await getServiceConfig(
//     config,
//     organization
//   );
//   return messageServiceSid;
// };

/**
 * Used to verify the organization is fully setup before a campaign can start
 * @param {*} organization 
 * @param {*} serviceManagerData 
 * @returns 
 */
export const fullyConfigured = async (organization, serviceManagerData) => {
  log.debug('telnyx::fullConfigured', { organization })
  // const result = await getMessageServiceSid(organization)
  if (!TELNYX_PUB_KEY) {
    log.error(`org: ${organization} using service Telnyx missing TELNYX_PUB_KEY`)
    return false
  }
  if (!TELNYX_API_KEY) {
    log.error(`org: ${organization} using service Telnyx missing TELNYX_API_KEY`)
    return false
  }
  return true
  // if (result.messagingProfileId) {
  //   return true
  // }
  // log.error(`org: ${organization} failed to load Telnyx requirements`)
  // return false

};

export default {
  createMessagingService,
  getMetadata,
  handleIncomingMessage,
  fullyConfigured,
  sendMessage,
  updateConfig,
};
