import { sendMessage, rentNewCell } from '../server/api/lib/nexmo'
import { getFormattedPhoneNumber } from '../lib/phone-format'
import { r, UserCell } from '../server/models'
import { log } from '../lib'

const PER_ASSIGNED_NUMBER_MESSAGE_COUNT = 350

async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}

async function assignUserNumbers() {
  const unassignedMessages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .filter({ user_number: '' })
  for (let index = 0; index < unassignedMessages.length; index++) {
    const message = unassignedMessages[index]
    let userNumber

    // always use already used cell in a thread with a user.
    const lastMessage = await r.table('message')
      .getAll(message.assignment_id, { index: 'assignment_id' })
      .filter({ contact_number: message.contact_number })
      .filter((doc) => doc('user_number').ne(''))
      .limit(1)(0)
      .default(null)

    const assignment = await r.table('assignment')
      .get(message.assignment_id)

    const userId = assignment.user_id

    let userCell = await r.table('user_cell')
      .getAll(userId, { index: 'user_id' })
      .filter({ is_primary: true })
      .limit(1)(0)
      .default(null)

    if (!userCell) {
      const newCell = await rentNewCell()

      userCell = new UserCell({
        cell: getFormattedPhoneNumber(newCell),
        user_id: userId,
        service: 'nexmo',
        is_primary: true
      })

      await userCell.save()
    }

    if (lastMessage) {
      userNumber = lastMessage.user_number
    } else {
      userNumber = userCell.cell
    }

    log.info("Assigning ", userNumber, " to message ", message.id)
    await r.table('message')
      .get(message.id)
      .update({ user_number: userNumber })

    // Cycle cell when necessary
    const messageCount = await r.table('message')
      .getAll(userCell.cell, { index: 'user_number' })
      .count()

    if (messageCount >= PER_ASSIGNED_NUMBER_MESSAGE_COUNT) {
      await r.table('user_cell')
        .get(userCell.id)
        .update({ is_primary: false })
    }
  }
}
async function sendMessages() {
  const messages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .filter((doc) => doc('user_number').ne(''))
    .group('user_number')
    .orderBy('created_at')
    .limit(1)(0)
  for (let index = 0; index < messages.length; index++) {
    log.info('sending message', messages[index].reduction)
    await sendMessage(messages[index].reduction)
  }
}

(async () => {
  while (true) {
    try {
      await sleep(1100)
      await assignUserNumbers()
      await sendMessages()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
