import { r, Campaign, CampaignContact, User, Assignment, InteractionStep } from '../server/models'
import { log, gunzip, zipToTimeZone } from '../lib'
import { sleep, getNextJob, updateJob } from './lib'
import nexmo from '../server/api/lib/nexmo'
import twilio from '../server/api/lib/twilio'

import AWS from 'aws-sdk'
import Baby from 'babyparse'
import moment from 'moment'
import { sendEmail } from '../server/mail'
import { Notifications, sendUserNotification } from '../server/notifications'

var zipMemoization = {}

export async function uploadContacts(job) {
  const campaignId = job.campaign_id
  // We do this deletion in schema.js but we do it again here just in case the the queue broke and we had a backlog of contact uploads for one campaign
  await r.table('campaign_contact')
    .getAll(campaignId, { index: 'campaign_id' })
    .delete()
  const maxPercentage = 100
  let contacts = await gunzip(new Buffer(job.payload, 'base64'))
  const chunkSize = 1000
  contacts = JSON.parse(contacts)
  const numChunks = Math.ceil(contacts.length / chunkSize)

  for (let index = 0; index < contacts.length; index++) {
    const datum = contacts[index]
    if (datum.zip) {
      // using memoization and large ranges of homogenous zips
      if (datum.zip in  zipMemoization) {
        datum.timezone_offset = zipMemoization[datum.zip]
      } else {
        const rangeZip = zipToTimeZone(datum.zip)
        if (rangeZip) {
          datum.timezone_offset = `${rangeZip[2]}_${rangeZip[3]}`
        } else {
          const zipDatum = await r.table('zip_code').get(datum.zip)
          if (zipDatum) {
            datum.timezone_offset = `${zipDatum.timezone_offset}_${zipDatum.has_dst}`
          }
          zipMemoization[datum.zip] = datum.timezone_offset
        }
      }
    }
  }

  for (let index = 0; index < numChunks; index++) {
    await updateJob(job, Math.round((maxPercentage / numChunks) * index))
    const savePortion = contacts.slice(index * chunkSize, (index + 1) * chunkSize)
    await CampaignContact.save(savePortion)
  }

  if (process.env.SYNC_JOBS) {
    await r.table('job_request').get(job.id).delete()
  }
}

export async function createInteractionSteps(job) {
  const payload = JSON.parse(job.payload)
  const id = job.campaign_id
  const answerOptionStore = {}

  await r.table('interaction_step')
    .getAll(id, { index: 'campaign_id' })
    .delete()

  for (let index = 0; index < payload.interaction_steps.length; index++) {
    const step = payload.interaction_steps[index]
    const newId = step.id
    let parentId = ''
    let answerOption = ''

    if (newId in answerOptionStore) {
      parentId = answerOptionStore[newId]['parent']
      answerOption = answerOptionStore[newId]['value']
    }

    const dbInteractionStep = await InteractionStep
      .save({
        campaign_id: id,
        question: step.question,
        script: step.script,
        answer_option: answerOption,
        parent_interaction_id: parentId
      })

    if (step.answerOptions) {
       for (let innerIndex = 0; innerIndex < step.answerOptions.length; innerIndex++) {
         const option = step.answerOptions[innerIndex]
         let nextStepId = ''
         if (option.nextInteractionStepId) {
           nextStepId = option.nextInteractionStepId
         }
         // store the answers and step id for writing to child steps
         answerOptionStore[nextStepId] = {
           'value': option.value,
           'parent': dbInteractionStep.id
         }
       }
    }
  }

  if (process.env.SYNC_JOBS) {
    await r.table('job_request').get(job.id).delete()
  }
}

export async function assignTexters(job) {
  const payload = JSON.parse(job.payload)
  const id = job.campaign_id
  const texters = payload.texters
  const currentAssignments = await r.knex('assignment')
    .where('assignment.campaign_id', id)
    .join('campaign_contact', 'campaign_contact.id', 'assignment_id')
    .where({message_status: 'needsMessage'})
    .groupBy('user_id', 'assignment_id')
    .select('user_id', 'assignment_id', r.knex.raw('COUNT(campaign_contact.id) as needsMessageCount'))
    .catch(log.error)

  const unchangedTexters = {}
  const changedAssignments = currentAssignments.map((assignment) => {
    const texter = texters.filter((ele) => ele.id === assignment.user_id)[0]
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

  await updateJob(job, 10)
  await r.table('campaign_contact')
    .getAll(...changedAssignmentIds, { index: 'assignment_id' })
    .filter({ message_status: 'needsMessage' })
    .update({ message_status: '' })

  await updateJob(job, 20)

  let availableContacts = await r.table('campaign_contact')
    .getAll(null, { index: 'assignment_id' })
    .filter({ campaign_id: id })
    .count()
  // Go through all the submitted texters and create assignments
  const texterCount = texters.length
  for (let index = 0; index < texterCount; index++) {
    const texter = texters[index]
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
      .getAll(null, { index: 'assignment_id' })
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
    await updateJob(job, Math.floor((75 / texterCount) * (index + 1)) + 20)
  }
  const assignmentsToDelete = await r.knex('assignment')
    .where('assignment.campaign_id', id)
    .join('campaign_contact', 'assignment.id', 'assignment_id')
    .groupBy('assignment_id')
    .select('assignment_id')
    .havingRaw('COUNT(campaign_contact.id) = 0')
    .catch(log.error)

  if (assignmentsToDelete.length) {
    await r.table('assignment')
      .getAll(...assignmentsToDelete.map((ele) => ele.assignment_id))
      .delete()
  }

  if (process.env.SYNC_JOBS) {
    await r.table('job_request').get(job.id).delete()
  }
}

export async function exportCampaign(job) {
  const payload = JSON.parse(job.payload)
  const jobId = job.id
  const id = job.campaign_id
  const campaign = await Campaign.get(id)
  const requester = payload.requester
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
  const assignments = await r.knex('assignment')
    .where('campaign_id', id)
    .join('user', 'user_id', 'user.id')
    .select('assignment.id as id',
            //user fields
            'first_name', 'last_name', 'email', 'cell', 'assigned_cell')
  const assignmentCount = assignments.length

  for (let index = 0; index < assignmentCount; index++) {
    const assignment = assignments[index]
    const optOuts = await r.table('opt_out')
      .getAll(assignment.id, { index: 'assignment_id' })

    const contacts = await r.table('campaign_contact')
      .getAll(assignment.id, { index: 'assignment_id' })
      .eqJoin('zip', r.table('zip_code'))
      .zip()

    const messages = await r.table('message')
      .getAll(assignment.id, { index: 'assignment_id' })
    let convertedMessages = messages.map((message) => {
      const messageRow = {
        assignmentId: message.assignment_id,
        campaignId: campaign.id,
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
        campaignId: campaign.id,
        campaign: campaign.title,
        assignmentId: assignment.id,
        'texter[firstName]': assignment.first_name,
        'texter[lastName]': assignment.last_name,
        'texter[email]': assignment.email,
        'texter[cell]': assignment.cell,
        'texter[assignedCell]': assignment.assigned_cell,
        'contact[firstName]': contact.first_name,
        'contact[lastName]': contact.last_name,
        'contact[cell]': contact.cell,
        'contact[zip]': contact.zip,
        'contact[city]': contact.city ? contact.city : null,
        'contact[state]': contact.state ? contact.state : null,
        'contact[optOut]': optOuts.find((ele) => ele.cell === contact.cell) ? 'true' : 'false',
        'contact[messageStatus]': contact.message_status
      }
      const customFields = JSON.parse(contact.custom_fields)
      Object.keys(customFields).forEach((fieldName) => {
        contactRow[`contact[${fieldName}]`] = customFields[fieldName]
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
    const campaignTitle = campaign.title.replace(/ /g, '_').replace(/\//g, '_')
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

const serviceMap = { nexmo, twilio }

export async function sendMessages(queryFunc) {
  let messages = r.knex('message')
    .where({'send_status': 'QUEUED'})

  if (queryFunc) {
    messages = queryFunc(messages)
  }
  messages = await messages.orderBy('created_at')

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index]
    const service = serviceMap[message.service || process.env.DEFAULT_SERVICE]
    log.info(`Sending (${message.service}): ${message.user_number} -> ${message.contact_number}\nMessage: ${message.text}`)
    await service.sendMessage(message)
  }
}
