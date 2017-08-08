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

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS
const serviceMap = { nexmo, twilio }

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

  if (JOBS_SAME_PROCESS) {
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
      }).catch(log.error)

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

  if (JOBS_SAME_PROCESS) {
    await r.table('job_request').get(job.id).delete()
  }
}

export async function assignTexters(job) {
  // Assigns UNassigned campaign contacts to texters
  // It does NOT re-assign contacts to other texters
  // STEPS:
  // 1. get currentAssignments = all current assignments
  //       .needsMessageCount = contacts that haven't been contacted yet
  // 2. changedAssignments = assignments where texter was removed or needsMessageCount different
  //                  needsMessageCount differ possibilities:
  //                  a. they started texting folks, so needsMessageCount is less
  //                  b. they were assigned a different number by the admin
  // 3. update changed assignments (temporarily) not to be in needsMessage status
  // 4. availableContacts: count of contacts without an assignment
  // 5. forEach texter:
  //        * skip if 'unchanged'
  //        * 
  const payload = JSON.parse(job.payload)
  const cid = job.campaign_id
  const texters = payload.texters
  const currentAssignments = await r.knex('assignment')
    .where('assignment.campaign_id', cid)
    .joinRaw("left join campaign_contact "
             +"ON (campaign_contact.assignment_id = assignment.id "
             +    "AND campaign_contact.message_status = 'needsMessage')")
    .groupBy('user_id', 'assignment.id')
    .select('user_id', 'assignment.id as id', r.knex.raw('COUNT(campaign_contact.id) as needs_message_count'))
    .catch(log.error)

  const unchangedTexters = {}
  const demotedTexters = {}

  const changedAssignments = currentAssignments.map((assignment) => {
    const texter = texters.filter((ele) => parseInt(ele.id) === assignment.user_id)[0]
    if (texter && texter.needsMessageCount === assignment.needs_message_count) {
      unchangedTexters[assignment.user_id] = true
      return null
    } else {
      const numToUnassign = Math.max(0, assignment.needs_message_count - (texter && texter.needsMessageCount || 0))
      if (numToUnassign) {
        demotedTexters[assignment.id] = numToUnassign
        return null //not changed, just demoted
      } else {
        return assignment
      }
    }
  }).filter((ele) => ele !== null)

  for (let a_id in demotedTexters) {
    await r.knex('campaign_contact')
      .where('id', 'in',
             r.knex('campaign_contact')
             .where('assignment_id', a_id)
             .where('message_status', 'needsMessage')
             .limit(demotedTexters[a_id])
             .select('id')
             .forUpdate()
            )
      .update({assignment_id: null})
      .catch(log.error)
  }

  // This atomically updates all the assignments to guard against people sending messages while all this is going on
  const changedAssignmentIds = changedAssignments.map((ele) => ele.id)

  await updateJob(job, 10)
  if (changedAssignmentIds.length) {
    // TODO: we need to reverse this below!!
    // ^^^actually this seems to get updated, but where/how?
    await r.table('campaign_contact')
      .getAll(...changedAssignmentIds, { index: 'assignment_id' })
      .filter({ message_status: 'needsMessage' })
      .update({ message_status: 'UPDATING' })
      .catch(log.error)
  }

  await updateJob(job, 20)

  let availableContacts = await r.table('campaign_contact')
    .getAll(null, { index: 'assignment_id' })
    .filter({ campaign_id: cid })
    .count()
  // Go through all the submitted texters and create assignments
  const texterCount = texters.length
  for (let index = 0; index < texterCount; index++) {
    const texter = texters[index]
    const texterId = parseInt(texter.id)
    if (unchangedTexters[texterId]) {
      continue
    }
    const contactsToAssign = Math.min(availableContacts, texter.needsMessageCount)
    availableContacts = availableContacts - contactsToAssign
    const existingAssignment = changedAssignments.find((ele) => ele.user_id === texterId)
    let assignment = null
    if (existingAssignment) {
      assignment = new Assignment({id: existingAssignment.id,
                                   user_id: existingAssignment.user_id,
                                   campaign_id: cid})
    } else {
      assignment = await new Assignment({
        user_id: texterId,
        campaign_id: cid
      }).save()
    }

    let currentEmpties = await r.table('campaign_contact')
      .getAll(null, { index: 'assignment_id' })
      .filter({ campaign_id: cid })

    if (contactsToAssign) {
      await r.knex('campaign_contact')
        .where('id', 'in',
               r.knex('campaign_contact')
               .where({ assignment_id: null,
                        campaign_id: cid
                      })
               .limit(contactsToAssign)
               .select('id')
               .forUpdate())
        .update({ assignment_id: assignment.id })
        .catch(log.error)
        .then(log.info)
    }

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
    .where('assignment.campaign_id', cid)
    .join('campaign_contact', 'assignment.id', 'campaign_contact.assignment_id')
    .groupBy('assignment_id')
    .select('assignment_id')
    .havingRaw('COUNT(campaign_contact.id) = 0')
    .catch(log.error)

  if (assignmentsToDelete.length) {
    await r.table('assignment')
      .getAll(...assignmentsToDelete.map((ele) => ele.assignment_id))
      .delete()
      .catch(log.error)
  }

  if (JOBS_SAME_PROCESS) {
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

// add an in-memory guard that the same messages are being sent again and again
let pastMessages = []

export async function sendMessages(queryFunc) {
  let messages = r.knex('message')
    .where({'send_status': 'QUEUED'})

  if (queryFunc) {
    messages = queryFunc(messages)
  }
  messages = await messages.orderBy('created_at')

  for (let index = 0; index < messages.length; index++) {
    let message = messages[index]
    if (pastMessages.indexOf(message.id) != -1) {
      throw new Error("Encountered send message request of the same message."
                      + " This is scary!  If ok, just restart process. Message ID: " + message.id)
    }
    message.service = message.service || process.env.DEFAULT_SERVICE
    const service = serviceMap[message.service]
    log.info(`Sending (${message.service}): ${message.user_number} -> ${message.contact_number}\nMessage: ${message.text}`)
    await service.sendMessage(message)
    pastMessages.push(message.id)
    pastMessages = pastMessages.slice(-100) //keep the last 100
  }
}
