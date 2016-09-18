import { r, Campaign, User, JobRequest } from '../server/models'
import { log } from '../lib'
import AWS from 'aws-sdk'
import Baby from 'babyparse'
import moment from 'moment'
import { sendEmail } from '../server/mail'

async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}

async function exportCampaign(jobId, { id, requester }) {
  const user = User.get(requester)
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
        'assignmentId': assignment.id,
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
    await JobRequest.get(jobId).update({
      status: Math.round(index / assignmentCount * 100),
      updated_at: new Date()
    })
    await sleep(1000)
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
    params = { Key: key, Expires: 86400 }
    const campaignMessagesExportUrl = await s3bucket.getSignedUrl('getObject', params)
    await sendEmail({
      to: 'saikat1@gmail.com',
//      to: user.email,
      subject: `Export ready for ${campaign.title}`,
      text: `Your Spoke exports are ready! These URLs will be valid for 24 hours.\nCampaign export: ${campaignExportUrl}\n
      Message export: ${campaignMessagesExportUrl}`
    })
    const jobRequest = await JobRequest.get(jobId)
    await jobRequest.delete()
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
      const exportJob = await r.table('job_request')
        .getAll(['export', false], { index: 'unassigned_job' })
        .limit(1)(0)
        .default(null)
      if (exportJob) {
        const updateResults = await r.table('job_request')
          .get(exportJob.id)
          .update({ assigned: true })
        if (updateResults.replaced !== 1) {
          continue
        }
        await exportCampaign(exportJob.id, exportJob.payload)
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
