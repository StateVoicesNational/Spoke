import BandwidthMessaging from "@bandwidth/messaging";

import { log } from "../../../lib";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import { cacheableData, Log, Message } from "../../../server/models";
import { saveNewIncomingMessage, parseMessageText } from "../message-sending";
import { getMessageServiceConfig, getConfigKey } from "../service_map";

const ENABLE_DB_LOG = getConfig("ENABLE_DB_LOG");

// https://dev.bandwidth.com/messaging/errors/codes.html
const errorDescriptions = {
  4001: "Service not allowed (Catch-all error)",
  4702: "Contact is unavailable or unreachable",
  4720: "Invalid destination (possibly a landline)",
  4721: "Contact's carrier service deactivated",
  4750: "Carrier rejected message",
  4770: "Carrier rejected as SPAM",
  4775: "Carrier rejected due to user opt-out",
  4780: "Carrier rejected due to P2P volumetric violation",
  5600: "Carrier Service Unavailable",
  5610: "Carrier Service Failure",
  5630: "No response or ack received from the Carrier",
  5650: "Carrier Service reports a failure to send to destination",
  9902: "Timed out waiting for delivery receipt. (Reason unknown)"
};

export function errorDescription(errorCode) {
  return {
    code: errorCode,
    description: errorDescriptions[errorCode] || "Bandwidth error",
    link: `https://dev.bandwidth.com/messaging/errors/codes.html`
  };
}

export async function getBandwidthController(organization, config) {
  const password = await convertSecret(
    "bandwidthPassword",
    organization,
    config.password
  );
  const client = new BandwidthMessaging.Client({
    timeout: 0,
    basicAuthUserName: config.userName,
    basicAuthPassword: password
  });
  return new BandwidthMessaging.ApiController(client);
}

export async function sendMessage({
  message,
  contact,
  trx,
  organization,
  campaign,
  serviceManagerData
}) {
  const config = await getMessageServiceConfig(
    "bandwidth",
    organization,
    serviceManagerData
  );
  // applicationId will probably come from config, unless serviceManager is doing something fancy
  const applicationId =
    (serviceManagerData && serviceManagerData.messageservice_sid) ||
    message.messageservice_sid ||
    config.applicationId;
  // userNumber will probably come from serviceManagerData; config is unlikely to have userNumber
  const userNumber =
    (serviceManagerData && serviceManagerData.user_number) ||
    message.user_number ||
    config.userNumber;

  const changes = {};
  if (applicationId && applicationId != message.messageservice_sid) {
    changes.messageservice_sid = applicationId;
  }
  if (userNumber && userNumber != message.user_number) {
    changes.user_number = userNumber;
  }

  const parsedMessage = parseMessageText(message);
  const tag = `${(organization && organization.id) || ""}|${(contact &&
    contact.campaign_id) ||
    ""}|${(contact && contact.id) || ""}`;
  const bandwidthMessage = {
    applicationId,
    to: [message.contact_number],
    from: userNumber,
    text: parsedMessage.body,
    tag
  };
  if (parsedMessage.mediaUrl) {
    bandwidthMessage.media = [parsedMessage.mediaUrl];
  }

  let response;
  if (/bandwidthapitest/.test(message.text)) {
    let err;
    const response = {
      // TODO FAKE DATA
      response: {},
      statusCode: 202, //accepted
      headers: {}
    };
    await postMessageSend({
      response,
      err,
      message,
      contact,
      trx,
      organization,
      changes
    });
    return;
  }
  try {
    const messagingController = await getBandwidthController(
      organization,
      config
    );
    const response = await messagingController.createMessage(
      config.accountId,
      bandwidthMessage
    );
  } catch (err) {
    await postMessageSend({
      err,
      message,
      contact,
      trx,
      organization,
      changes
    });
    return;
  }
  await postMessageSend({
    response,
    message,
    contact,
    trx,
    organization,
    changes
  });
}

export async function postMessageSend({
  message,
  contact,
  trx,
  err,
  response,
  organization,
  changes
}) {
  let changesToSave = changes
    ? {
        ...changes
      }
    : {};
}

export async function handleIncomingMessage(message, { orgId }) {
  // https://dev.bandwidth.com/messaging/callbacks/incomingSingle.html
  if (
    !message.hasOwnProperty("message") ||
    !message.hasOwnProperty("to") ||
    message.type !== "message-received"
  ) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`);
    return;
  }
  const { id, from, text, applicationId, media } = message.message;
  const contactNumber = getFormattedPhoneNumber(from);
  const userNumber = message.to ? getFormattedPhoneNumber(message.to) : "";
  const finalMessage = new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    media: media
      ? media.map(m => ({ url: m, type: `image/${m.split(".").pop()}` }))
      : null,
    error_code: null,
    service_id: id,
    messageservice_sid: applicationId,
    service: "bandwidth",
    send_status: "DELIVERED",
    user_id: null
  });
  await saveNewIncomingMessage(finalMessage);

  if (ENABLE_DB_LOG) {
    await Log.save({
      message_sid: id,
      body: JSON.stringify(message),
      error_code: -101,
      from_num: from || null,
      to_num: message.to || null
    });
  }
}

export async function handleDeliveryReport(report, { orgId }) {
  // https://dev.bandwidth.com/messaging/callbacks/msgDelivered.html
  // https://dev.bandwidth.com/messaging/callbacks/messageFailed.html

  const { id, from, applicationId, tag } = report.message;
  const contactNumber = getFormattedPhoneNumber(report.to);
  const userNumber = from ? getFormattedPhoneNumber(from) : "";
  // FUTURE: tag should have: "<orgId>|<campaignId>|<contactId>"
  await cacheableData.message.deliveryReport({
    contactNumber,
    userNumber,
    messageSid: id,
    service: "bandwidth",
    messageServiceSid: applicationId,
    newStatus: report.type === "message-failed" ? "ERROR" : "DELIVERED",
    errorCode: Number(report.errorCode || 0) || 0
  });
}
