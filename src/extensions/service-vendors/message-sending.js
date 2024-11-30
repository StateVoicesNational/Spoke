import { cacheableData } from "../../server/models";
export { parseMessageText } from "../../lib/scripts";

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

