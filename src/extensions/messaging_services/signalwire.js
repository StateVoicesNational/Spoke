/* eslint-disable no-use-before-define, no-console */
import { RestClient } from "@signalwire/node";
import urlJoin from "url-join";
import { getConfig } from "../../server/api/lib/config";
import { cacheableData } from "../../server/models";
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
const MAX_SIGNALWIRE_MESSAGE_VALIDITY = 14400;

export const name = "signalwire";

const getSignalwireBaseUrl = organization =>
  getConfig("SIGNALWIRE_BASE_CALLBACK_URL", organization) ||
  getConfig("BASE_URL");

export const getMessageReportPath = () => "signalwire-message-report";

export async function getSignalwire(organization) {
  const {
    authToken,
    accountSid,
    spaceUrl: signalwireSpaceUrl
  } = await cacheableData.organization.getSignalwireAuth(organization);
  if (accountSid && authToken && signalwireSpaceUrl) {
    return new RestClient(accountSid, authToken, { signalwireSpaceUrl });
  }
  return null;
}

export const fullyConfigured = async organization => {
  const {
    authToken,
    accountSid,
    spaceUrl
  } = await cacheableData.organization.getSignalwireAuth(organization);

  const messagingServiceConfigured = await cacheableData.organization.getMessageServiceSid(
    organization
  );

  if (!(authToken && accountSid && spaceUrl && messagingServiceConfigured)) {
    return false;
  }
  return true;
};
/**
 * Validate that the message came from SignalWire before proceeding.
 *
 * @param url The external-facing URL; this may be omitted to use the URL from the request.
 */
const headerValidator = () => {
  // TODO -- implement this
  return (req, res, next) => next();
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
    process.env.SIGNALWIRE_MESSAGE_CALLBACK_URL ||
    global.SIGNALWIRE_MESSAGE_CALLBACK_URL;
  const statusCallbackUrl =
    process.env.SIGNALWIRE_STATUS_CALLBACK_URL ||
    global.SIGNALWIRE_STATUS_CALLBACK_URL;
  const validationFlag = getConfig("SIGNALWIRE_VALIDATION");

  _addServerEndpoints({
    expressApp,
    service: exports,
    messageCallbackUrl,
    statusCallbackUrl,
    validationFlag,
    headerValidator,
    twiml: RestClient.LaML
  });
};

export const convertMessagePartsToMessage = messageParts => {
  return _convertMessagePartsToMessage(messageParts, "signalwire");
};

export const sendMessage = async (
  _message,
  contact,
  trx,
  organization,
  campaign
) => {
  const message = _message;
  message.status_callback = `${getSignalwireBaseUrl(
    organization
  )}/${getMessageReportPath()}/${organization.id}`;

  const settings = {
    maxSendAttempts: MAX_SEND_ATTEMPTS,
    messageValidityPaddingSeconds: MESSAGE_VALIDITY_PADDING_SECONDS,
    maxServiceMessageValidity: MAX_SIGNALWIRE_MESSAGE_VALIDITY,
    messageServiceValidityPeriod:
      process.env.SIGNALWIRE_MESSAGE_VALIDITY_PERIOD,
    apiTestRegex: /twilioapitest/,
    apiTestTimeoutRegex: /twilioapitesterrortimeout/,
    serviceName: "signalwire",
    apiUrl: "api.signalwire.com"
  };

  const signalwire = await exports.getSignalwire(organization);

  return _sendMessage(
    signalwire,
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
  return _handleDeliveryReport(report, "signalwire");
};

export const handleIncomingMessage = async (
  _message,
  serviceName,
  organization
) => {
  const message = _message;
  if (!message.MessagingServiceSid) {
    message.MessagingServiceSid = await cacheableData.organization.getMessageServiceSid(
      organization,
      null,
      message.body
    );
  }

  return _handleIncomingMessage(message, "signalwire", organization);
};

/**
 * Create a new Signalwire messaging service
 */
export async function createMessagingService(organization, friendlyName) {
  const signalwire = await exports.getSignalwire(organization);
  const signalwireBaseUrl = getSignalwireBaseUrl(organization);
  return await signalwire.messaging.services.create({
    friendlyName,
    statusCallback: urlJoin(
      signalwireBaseUrl,
      getMessageReportPath(),
      organization.id.toString()
    ),
    inboundRequestUrl: urlJoin(
      signalwireBaseUrl,
      "signalwire",
      organization.id.toString()
    )
  });
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
  getSignalwire,
  getMessageReportPath
};
