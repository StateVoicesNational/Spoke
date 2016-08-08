import { r, Assignment, Campaign, User } from './models'
import { log } from '../lib'

export const Notifications = {
  CAMPAIGN_STARTED: 'campaign.started',
  ASSIGNMENT_MESSAGE_RECEIVED: 'assignment.message.received'
}

const sendEmail = async ({ to, subject, text }) => {
  const mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_SECRET_KEY,
    domain: process.env.MAILGUN_DOMAIN
  })

  return mailgun.messages().send({
    from: process.env.MAILGUN_FROM_EMAIL,
    to,
    subject,
    text
  })
}

const sendNewAssignmentUserNotification = async (assignment) => {
  const campaign = await Campaign.get(assignment.campaign_id)
  const user = await User.get(assignment.user_id)

  try {
    await sendEmail({
      to: user.email,
      subject: `You have a new assignment: ${campaign.title}`,
      text: `You've just been assigned a new campaign. See your todos here: \n\nhttps://spoke.gearshift.co/app/${campaign.organization_id}/todos`
    })
  } catch (e) {
    log.error(e)
  }
}

export const sendUserNotification = async (notification) => {
  const { type } = notification
  if (type === Notifications.CAMPAIGN_STARTED) {
    const assignments = await r.table('assignment')
      .getAll(notification.campaignId, { index: 'campaign_id' })
      .pluck('user_id')

    const count = assignments.length
    for (let i = 0; i < count; i++) {
      const assignment = assignments[i]
      sendNewAssignmentUserNotification(assignment)
    }
  } else if (type === Notifications.ASSIGNMENT_MESSAGE_RECEIVED) {
    const assignment = await Assignment.get(notification.assignmentId)
    const campaign = await Campaign.get(assignment.campaign_id)
    const user = await User.get(assignment.user_id)

    try {
      await sendEmail({
        to: user.email,
        subject: `New reply received for ${campaign.title}`,
        text: `Great! Someone sent you a message. Reply here: \n\nhttps://spoke.gearshift.co/app/${campaign.organization_id}/todos/${notification.assignmentId}/reply`
      })
    } catch (e) {
      log.error(e)
    }
  } else if (type === Notifications.ASSIGNMENT_CREATED) {
    const { assignment } = notification
    await sendNewAssignmentUserNotification(assignment)
  }
}

const setupIncomingReplyNotification = () => (
  r.table('message')
    .changes()
    .filter(r.and(r.row('new_val')('is_from_contact'), r.row('old_val').eq(null)))
    .then((cursor) => (
      cursor.each((err, message) => (
        sendUserNotification({
          type: Notifications.ASSIGNMENT_MESSAGE_RECEIVED,
          assignmentId: message.new_val.assignment_id
        })
      ))
    ))
)

const setupNewAssignmentNotification = () => (
  r.table('assignment')
    .changes()
    .filter(r.row('old_val').eq(null))
    .then((cursor) => (
      cursor.each((err, assignment) => (
        sendUserNotification({
          type: Notifications.ASSIGNMENT_CREATED,
          assignment
        })
      ))
    ))
)

export const setupUserNotificationObservers = () => {
  setupIncomingReplyNotification()
  setupNewAssignmentNotification()
}

