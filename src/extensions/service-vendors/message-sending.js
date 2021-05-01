import { cacheableData } from "../../server/models";

export async function getLastMessage({
  contactNumber,
  service,
  messageServiceSid,
  userNumber
}) {
  const lookup = await cacheableData.campaignContact.lookupByCell(
    contactNumber,
    service,
    messageServiceSid,
    userNumber
  );
  return lookup;
}

export async function saveNewIncomingMessage(messageInstance, contact) {
  await cacheableData.message.save({ messageInstance, contact });
}

const mediaExtractor = new RegExp(/\[\s*(http[^\]\s]*)\s*\]/);

export function parseMessageText(message) {
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
