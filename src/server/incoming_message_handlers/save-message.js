import { r } from "../models";

export const processMessage = async messageInstance => {
  if (messageInstance.service_id) {
    const countResult = await r.getCount(
      r.knex("message").where("service_id", messageInstance.service_id)
    );
    if (countResult) {
      console.error(
        "DUPLICATE MESSAGE SAVED",
        countResult.count,
        messageInstance
      );
    }
  }
  await messageInstance.save();

  await r
    .table("campaign_contact")
    .getAll(messageInstance.assignment_id, { index: "assignment_id" })
    .filter({ cell: messageInstance.contact_number })
    .limit(1)
    .update({ message_status: "needsResponse", updated_at: "now()" });

  return messageInstance;
};
