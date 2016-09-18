import { r, Assignment, Campaign, User, Organization } from './models'
import { log } from '../lib'
import { sendEmail } from './mail'

export const Notifications = {
  CAMPAIGN_STARTED: 'campaign.started',
  ASSIGNMENT_MESSAGE_RECEIVED: 'assignment.message.received',
  ASSIGNMENT_CREATED: 'assignment.created',
  ASSIGNMENT_UPDATED: 'assignment.updated'
}

const sendAssignmentUserNotification = async (assignment, notification) => {
  const campaign = await Campaign.get(assignment.campaign_id)

  if (!campaign.is_started) {
    return
  }

  const organization = await Organization.get(campaign.organization_id)
  const user = await User.get(assignment.user_id)
  let subject
  let text
  if (notification === Notifications.ASSIGNMENT_UPDATED) {
    subject = `[${organization.name}] Updated assignment: ${campaign.title}`
    text = `Your assignment changed: \n\nhttps://spoke.gearshift.co/app/${campaign.organization_id}/todos`
  } else if (notification === Notifications.ASSIGNMENT_CREATED) {
    subject = `[${organization.name}] New assignment: ${campaign.title}`
    text = `You just got a new texting assignment from ${organization.name}. You can start sending texts right away: \n\nhttps://spoke.gearshift.co/app/${campaign.organization_id}/todos`
  }

  try {
    await sendEmail({
      to: user.email,
      subject,
      text
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
      .pluck(['user_id', 'campaign_id'])

    const count = assignments.length
    for (let i = 0; i < count; i++) {
      const assignment = assignments[i]
      await sendAssignmentUserNotification(assignment, Notifications.ASSIGNMENT_CREATED)
    }
  } else if (type === Notifications.ASSIGNMENT_MESSAGE_RECEIVED) {
    const assignment = await Assignment.get(notification.assignmentId)
    const campaign = await Campaign.get(assignment.campaign_id)
    const organization = await Organization.get(campaign.organization_id)
    const user = await User.get(assignment.user_id)

    try {
      await sendEmail({
        to: user.email,
        subject: `[${organization.name}] [${campaign.title}] New reply`,
        text: `Someone responded to your message. Reply here: \n\nhttps://spoke.gearshift.co/app/${campaign.organization_id}/todos/${notification.assignmentId}/reply`
      })
    } catch (e) {
      log.error(e)
    }
  } else if (type === Notifications.ASSIGNMENT_CREATED) {
    const { assignment } = notification
    await sendAssignmentUserNotification(assignment, type)
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
          assignment: assignment.new_val
        })
      ))
    ))
)

export const setupUserNotificationObservers = () => {
  setupIncomingReplyNotification()
  setupNewAssignmentNotification()
}

