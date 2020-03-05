import { r, cacheableData } from "../../models";

export async function getLastMessage({
  contactNumber,
  service,
  messageServiceSid
}) {
  const lookup = await cacheableData.campaignContact.lookupByCell(
    contactNumber,
    service,
    messageServiceSid
  );
  return lookup;
}

export async function saveNewIncomingMessage(messageInstance, contact) {
  await cacheableData.message.save({ messageInstance, contact });
}
