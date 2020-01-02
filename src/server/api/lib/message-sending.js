import { r } from "../../models";

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

export async function saveNewIncomingMessage(messageInstance) {
  if (messageInstance.service_id) {
    const [duplicateMessage] = await r
      .knex("message")
      .where("service_id", messageInstance.service_id)
      .select("id")
      .limit(1);
    if (duplicateMessage) {
      console.error("DUPLICATE MESSAGE", duplicateMessage, messageInstance);
      return;
    }
  }
  await messageInstance.save();

  await r
    .table("campaign_contact")
    .getAll(messageInstance.campaign_contact_id, {
      index: "campaign_contact_id"
    })
    .limit(1)
    .update({ message_status: "needsResponse", updated_at: "now()" });
}
