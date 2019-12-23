import { r } from "../../models";

import { processMessage } from "../../incoming_message_handlers";

export async function getLastMessage({ contactNumber, service }) {
  const lastMessage = await r
    .table("message")
    .getAll(contactNumber, { index: "contact_number" })
    .filter({
      is_from_contact: false,
      service
    })
    .orderBy(r.desc("created_at"))
    .limit(1)
    .pluck("assignment_id")(0)
    .default(null);

  return lastMessage;
}

export async function processNewIncomingMessage(messageInstance) {
  await processMessage(messageInstance);
}
