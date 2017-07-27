import { r } from '../../models'

export async function getLastMessage({ userId, contactNumber, service }) {
  const lastMessage = await r.table('message')
    .getAll(contactNumber, { index: 'contact_number' })
    .filter({
      is_from_contact: false,
      service: service
    })
    .orderBy(r.desc('created_at'))
    .eqJoin("assignment_id", r.table("assignment"))('right')
    .filter({
      user_id: userId
    })
    .eqJoin("id", r.table("message"), {index: "assignment_id"})('right')
    .limit(1)
    .pluck('assignment_id')(0)
    .default(null)

  return lastMessage
}

export async function saveNewIncomingMessage (messageInstance) {
  await messageInstance.save()

  await r.table('campaign_contact')
    .getAll(messageInstance.assignment_id, { index: 'assignment_id' })
    .filter({ cell: messageInstance.contact_number })
    .limit(1)
    .update({ message_status: 'needsResponse' })
}
