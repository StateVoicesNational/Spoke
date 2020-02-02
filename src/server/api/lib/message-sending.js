import { r, cacheableData } from "../../models";

export async function getLastMessage({
  contactNumber,
  service,
  messageServiceSid
}) {
  const lastMessage = await r
    .knex("message")
    .select("campaign_contact_id")
    .where({
      contact_number: contactNumber,
      messageservice_sid: messageServiceSid,
      is_from_contact: false,
      service
    })
    .orderBy("created_at", "desc")
    .first();

  return lastMessage;
}

export async function saveNewIncomingMessage(messageInstance, contact) {
  await cacheableData.message.save({ messageInstance, contact });
}
