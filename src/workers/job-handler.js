import { r, Campaign, CampaignContact, User, JobRequest } from '../server/models'
import { log, gunzip } from '../lib'
import { sleep, getNextJob, updateJob } from './lib'
import AWS from 'aws-sdk'
import Baby from 'babyparse'
import moment from 'moment'
import { sendEmail } from '../server/mail'

async function uploadContacts(job) {
  const payload = job.payload
  const campaignId = payload.id
  // We do this deletion in schema.js but we do it again here just in case the the queue broke and we had a backlog of contact uploads for one campaign
  await r.table('campaign_contact')
    .getAll(campaignId, { index: 'campaign_id' })
    .delete()
  const maxPercentage = payload.hasOwnProperty('texters') ? 50 : 100
  let contacts = await gunzip(payload.contacts)
  const chunkSize = 1000
  contacts = JSON.parse(contacts)
  const numChunks = Math.ceil(contacts.length / chunkSize)

  for (let index = 0; index < numChunks; index++) {
    await updateJob(job, Math.round((maxPercentage / numChunks) * index))
    const savePortion = contacts.slice(index * chunkSize, (index + 1) * chunkSize)
    await CampaignContact.save(savePortion)
  }
}
  /*
  let availableContacts = 0
    if (campaign.hasOwnProperty('contacts')) {
      availableContacts = campaign.contacts.length
    } else {
      availableContacts = await r.table('campaign_contact')
        .getAll('', { index: 'assignment_id' })
        .filter({ campaign_id: id })
        .count()
    }
    const currentAssignments = await r.table('assignment')
      .getAll(id, { index: 'campaign_id' })
      .merge((row) => ({
        needsMessageCount: r.table('campaign_contact')
          .getAll(row('id'), { index: 'assignment_id' })
          .filter({ message_status: 'needsMessage' })
          .count()
      }))

    const unchangedTexters = {}
    const changedAssignments = currentAssignments.map((assignment) => {
      const texter = campaign.texters.filter((ele) => ele.id === assignment.user_id)[0]
      if (!texter) {
        return assignment
      } else if (texter.needsMessageCount !== assignment.needsMessageCount) {
        return assignment
      }
      unchangedTexters[assignment.user_id] = true
      return null
    })
    .filter((ele) => ele !== null)

    // This atomically updates all the assignments to guard against people sending messages while all this is going on
    const changedAssignmentIds = changedAssignments.map((ele) => ele.id)
    await r.table('campaign_contact')
      .getAll(...changedAssignmentIds, { index: 'assignment_id' })
      .filter({ message_status: 'needsMessage' })
      .update({
        assignment_id: r.branch(r.row('message_status').eq('needsMessage'), '', r.row('assignment_id'))
      })

    // Go through all the submitted texters and create assignments
    const texterCount = campaign.texters.length
    for (let index = 0; index < texterCount; index++) {
      const texter = campaign.texters[index]
      if (unchangedTexters[texter.id]) {
        continue
      }
      const contactsToAssign = availableContacts > texter.needsMessageCount ? texter.needsMessageCount : availableContacts
      availableContacts = availableContacts - contactsToAssign
      const existingAssignment = changedAssignments.find((ele) => ele.user_id === texter.id)
      let assignment = null
      if (existingAssignment) {
        assignment = existingAssignment
      } else {
        assignment = await new Assignment({
          user_id: texter.id,
          campaign_id: id
        }).save()
      }
      await r.table('campaign_contact')
        .getAll('', { index: 'assignment_id' })
        .filter({ campaign_id: id })
        .limit(contactsToAssign)
        .update({ assignment_id: assignment.id })

      if (existingAssignment) {
        // We can't rely on an observer because nothing
        // about the actual assignment object changes
        await sendUserNotification({
          type: Notifications.ASSIGNMENT_UPDATED,
          assignment
         })
      }
    }
    const assignmentsToDelete = await r.table('assignment')
      .getAll(id, { index: 'campaign_id' })
      .merge((row) => ({
        count: r.table('campaign_contact')
          .getAll(row('id'), { index: 'assignment_id' })
          .count()
      }))
      .filter((row) => row('count').eq(0))
    await r.table('assignment')
      .getAll(...assignmentsToDelete.map((ele) => ele.id))
      .delete()
}
*/
async function exportCampaign(job) {
  const jobId = job.id
  const id = job.payload.id
  const requester = job.payload.requester
  const user = await User.get(requester)
  const allQuestions = {}
  const questionCount = {}
  const interactionSteps = await r.table('interaction_step')
    .getAll(id, { index: 'campaign_id' })

  interactionSteps.forEach((step) => {
    if (!step.question || step.question.trim() === '') {
      return
    }

    if (questionCount.hasOwnProperty(step.question)) {
      questionCount[step.question] += 1
    } else {
      questionCount[step.question] = 0
    }
    const currentCount = questionCount[step.question]
    if (currentCount > 0) {
      allQuestions[step.id] = `${step.question}_${currentCount}`
    } else {
      allQuestions[step.id] = step.question
    }
  })

  let finalCampaignResults = []
  let finalCampaignMessages = []
  const assignments = await r.table('assignment')
    .getAll(id, { index: 'campaign_id' })
    .merge((row) => ({
      texter: r.table('user')
        .get(row('user_id'))
    }))
  const assignmentCount = assignments.length

  for (let index = 0; index < assignmentCount; index++) {
    const assignment = assignments[index]
    const optOuts = await r.table('opt_out')
      .getAll(assignment.id, { index: 'assignment_id' })

    const contacts = await r.table('campaign_contact')
      .getAll(assignment.id, { index: 'assignment_id' })
      .merge((row) => ({
        location: r.table('zip_code').get(row('zip'))
      }))

    const messages = await r.table('message')
      .getAll(assignment.id, { index: 'assignment_id' })
    let convertedMessages = messages.map((message) => {
      const messageRow = {
        assignmentId: message.assignment_id,
        userNumber: message.user_number,
        contactNumber: message.contact_number,
        isFromContact: message.is_from_contact,
        sendStatus: message.send_status,
        attemptedAt: moment(message.created_at).toISOString(),
        text: message.text
      }
      return messageRow
    })

    convertedMessages = await Promise.all(convertedMessages)
    finalCampaignMessages = finalCampaignMessages.concat(convertedMessages)
    let convertedContacts = contacts.map(async (contact) => {
      const contactRow = {
        assignmentId: assignment.id,
        'texter[firstName]': assignment.texter.first_name,
        'texter[lastName]': assignment.texter.last_name,
        'texter[email]': assignment.texter.email,
        'texter[cell]': assignment.texter.cell,
        'texter[assignedCell]': assignment.texter.assigned_cell,
        'contact[firstName]': contact.first_name,
        'contact[lastName]': contact.last_name,
        'contact[cell]': contact.cell,
        'contact[zip]': contact.zip,
        'contact[city]': contact.location ? contact.location.city : null,
        'contact[state]': contact.location ? contact.location.state : null,
        'contact[optOut]': optOuts.find((ele) => ele.cell === contact.cell) ? 'true' : 'false',
        'contact[messageStatus]': contact.message_status
      }

      Object.keys(contact.custom_fields).forEach((fieldName) => {
        contactRow[`contact[${fieldName}]`] = contact.custom_fields[fieldName]
      })

      const questionResponses = await r.table('question_response')
        .getAll(contact.id, { index: 'campaign_contact_id' })
      Object.keys(allQuestions).forEach((stepId) => {
        let value = ''
        questionResponses.forEach((response) => {
          if (response.interaction_step_id === stepId) {
            value = response.value
          }
        })
        contactRow[`question[${allQuestions[stepId]}]`] = value
      })

      return contactRow
    })
    convertedContacts = await Promise.all(convertedContacts)
    finalCampaignResults = finalCampaignResults.concat(convertedContacts)

    await updateJob(job, Math.round(index / assignmentCount * 100))
  }
  const campaignCsv = Baby.unparse(finalCampaignResults)
  const messageCsv = Baby.unparse(finalCampaignMessages)

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const s3bucket = new AWS.S3({ params: { Bucket: 'spoke-exports' } })
    const campaign = await Campaign.get(id)
    const campaignTitle = campaign.title.replace(/ /g, '_').substring(0, 20)
    const key = `${campaignTitle}-${moment().format('YYYY-MM-DD-HH-mm-ss')}.csv`
    const messageKey = `${key}-messages.csv`
    let params = { Key: key, Body: campaignCsv }
    await s3bucket.putObject(params).promise()
    params = { Key: key, Expires: 86400 }
    const campaignExportUrl = await s3bucket.getSignedUrl('getObject', params)
    params = { Key: messageKey, Body: messageCsv }
    await s3bucket.putObject(params).promise()
    params = { Key: messageKey, Expires: 86400 }
    const campaignMessagesExportUrl = await s3bucket.getSignedUrl('getObject', params)
    await sendEmail({
      to: user.email,
      subject: `Export ready for ${campaign.title}`,
      text: `Your Spoke exports are ready! These URLs will be valid for 24 hours.

      Campaign export: ${campaignExportUrl}

      Message export: ${campaignMessagesExportUrl}`
    })
    log.info(`Successfully exported ${id}`)
  } else {
    log.debug('Would have saved the following to S3:')
    log.debug(campaignCsv)
    log.debug(messageCsv)
  }
}

(async () => {
  while (true) {
    try {
      await sleep(1000)
      const exportJob = await getNextJob('export')
      if (exportJob) {
        await exportCampaign(exportJob)
        await r.table('job_request')
          .get(exportJob.id)
          .delete()
      }

      const uploadContactsJob = await getNextJob('upload_contacts')
      if (uploadContactsJob) {
        await uploadContacts(uploadContactsJob)
        await r.table('job_request')
          .get(uploadContactsJob.id)
          .delete()
      }

      await r.table('job_request')
        .filter({
          assigned: true
        })
        .filter((row) => row('updated_at')
          .lt(r.now().sub(60 * 2)))
        .delete()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
