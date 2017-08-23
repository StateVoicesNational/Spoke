import { r, datawarehouse, Campaign, CampaignContact, User, Assignment, InteractionStep } from '../server/models'
import { log, gunzip, zipToTimeZone } from '../lib'
import { sleep, getNextJob, updateJob } from './lib'
import nexmo from '../server/api/lib/nexmo'
import twilio from '../server/api/lib/twilio'
import { getLastMessage, saveNewIncomingMessage } from '../server/api/lib/message-sending'

import AWS from 'aws-sdk'
import Baby from 'babyparse'
import moment from 'moment'
import { sendEmail } from '../server/mail'
import { Notifications, sendUserNotification } from '../server/notifications'

var zipMemoization = {}

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS
const serviceMap = { nexmo, twilio }

async function getTimezoneByZip(zip) {
  if (zip in zipMemoization) {
    return zipMemoization[zip]
  } else {
    const rangeZip = zipToTimeZone(zip)
    if (rangeZip) {
      return `${rangeZip[2]}_${rangeZip[3]}`
    } else {
      const zipDatum = await r.table('zip_code').get(zip)
      if (zipDatum) {
        zipMemoization[zip] = `${zipDatum.timezone_offset}_${zipDatum.has_dst}`
        return zipMemoization[zip]
      }
    }
  }
}

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
      datum.timezone_offset = await getTimezoneByZip(datum.zip)
    }
  }

  for (let index = 0; index < numChunks; index++) {
    await updateJob(job, Math.round((maxPercentage / numChunks) * index))
    const savePortion = contacts.slice(index * chunkSize, (index + 1) * chunkSize)
    await CampaignContact.save(savePortion)
  }

  if (JOBS_SAME_PROCESS && job.id) {
    await r.table('job_request').get(job.id).delete()
  }
}


export async function loadContactsFromDataWarehouse(job) {
  let sql_query = job.payload
  if (!sql_query.startsWith('SELECT') || sql_query.indexOf(';') >= 0) {
    log.error('Malformed SQL statement.  Must begin with SELECT and not have any semicolons: ', sql_query)
    return
  }
  if (!datawarehouse) {
    log.error('No data warehouse connection, so cannot load contacts', job)
    return
  }

  knexResult = await datawarehouse.raw(sql_query)
  let fields = {}
  let customFields = {}
  const contactFields = {
    first_name: 1,
    last_name: 1,
    cell: 1,
    zip: 1
  }
  knexResult.fields.forEach((f) => {
    fields[f.name] = 1
    if (! (f.name in contactFields)) {
      customFields[f.name] = 1
    }
  })
  if (! ('first_name' in fields && 'last_name' in fields && 'cell' in fields)) {
    log.error('SQL statement does not return first_name, last_name, and cell: ', sql_query, fields)
    return
  }
  //TODO break up result and save in portions, dispatched
  const savePortion = knexResult.rows.map((row) => {
    let contact = {
      'first_name': row.first_name,
      'last_name': row.last_name,
      'cell': row.cell,
      'zip': row.zip,
    }
    let contactCustomFields = {}
    for (let f in customFields) {
      contactCustomFields[f] = row[f]
    }
    contact.custom_fields = JSON.stringify(contactCustomFields)
    if (contact.zip) {
      contact.timezone_offset = getTimezoneByZip(contact.zip)
    }
    return contact
  })
  await CampaignContact.save(savePortion)
  // dispatch something that tests completion?
  if (JOBS_SAME_PROCESS && job.id) {
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

  if (JOBS_SAME_PROCESS && job.id) {
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
  //        * if new texter, create assignment record
  //        * update X needsMessage campaign_contacts with texter's assignment record
  //             (min of needsMessageCount,availableContacts)
  // 6. delete assignments with a 0 assignment count
  // SCENARIOS:
  // * deleted texter:
  //   ends up in currentAssignments and changedAssignments
  //   marked as demoted texter, so all contacts are set assignment_id=null
  // * texter with fewer count:
  //   ends up in currentAssignments and changedAssignments
  //   marked as demoted texter: all current contacts are removed
  //   iterating over texter, the currentAssignment re-assigns needsMessageCount more texters
  // * new texter
  //   no current/changed assignment
  //   iterating over texter, assignment is created, then apportioned needsMessageCount texters
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
    if (texter && texter.needsMessageCount === parseInt(assignment.needs_message_count)) {
      unchangedTexters[assignment.user_id] = true
      return null
    } else {
      const numToUnassign = Math.max(0, assignment.needs_message_count - (texter && texter.needsMessageCount || 0))
      if (numToUnassign) {
        demotedTexters[assignment.id] = numToUnassign
      }
      return assignment
    }
  }).filter((ele) => ele !== null)

  for (let a_id in demotedTexters) {
    // Here we demote ALL the demotedTexters contacts (not just the demotion count)
    // because they will get reapportioned below
    await r.knex('campaign_contact')
      .where('id', 'in',
             r.knex('campaign_contact')
             .where('assignment_id', a_id)
             .where('message_status', 'needsMessage')
             .select('id')
            )
      .update({assignment_id: null})
      .catch(log.error)
  }

  // This atomically updates all the assignments to guard against people sending messages while all this is going on
  const changedAssignmentIds = changedAssignments.map((ele) => ele.id)

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
    if (contactsToAssign === 0) {
      // avoid creating a new assignment when the texter should get 0
      continue
    }
    availableContacts = availableContacts - contactsToAssign
    const existingAssignment = currentAssignments.find((ele) => ele.user_id === texterId)
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

    await r.knex('campaign_contact')
      .where('id', 'in',
             r.knex('campaign_contact')
             .where({ assignment_id: null,
                      campaign_id: cid
                    })
             .limit(contactsToAssign)
             .select('id'))
      .update({ assignment_id: assignment.id })
      .catch(log.error)

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
  const assignmentsToDelete = r.knex('assignment')
    .where('assignment.campaign_id', cid)
    .leftJoin('campaign_contact', 'assignment.id', 'campaign_contact.assignment_id')
    .groupBy('assignment.id')
    .havingRaw('COUNT(campaign_contact.id) = 0')
    .select('assignment.id as id')

  await r.knex('assignment')
    .where('id', 'in', assignmentsToDelete)
    .delete()
    .catch(log.error)

  if (JOBS_SAME_PROCESS && job.id) {
    await r.table('job_request').get(job.id).delete()
  }
}

export async function exportCampaign(job) {
  const payload = JSON.parse(job.payload)
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

    const contacts = await r.knex('campaign_contact')
      .leftJoin('zip_code', 'zip_code.zip', 'campaign_contact.zip')
      .select()
      .where('assignment_id', assignment.id)
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
        'contact[messageStatus]': contact.message_status,
        'contact[external_id]': contact.external_id
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

  if (process.env.AWS_ACCESS_AVAILABLE || (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
    const s3bucket = new AWS.S3({ params: { Bucket: process.env.AWS_S3_BUCKET_NAME } })
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

  if (JOBS_SAME_PROCESS && job.id) {
    await r.table('job_request').get(job.id).delete()
  }
}

// add an in-memory guard that the same messages are being sent again and again
let pastMessages = []

export async function sendMessages(queryFunc, defaultStatus) {
  let messages = r.knex('message')
    .where({'send_status': defaultStatus || 'QUEUED'})

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

export async function handleIncomingMessageParts() {
  const messageParts = await r.table('pending_message_part')
  const messagePartsByService = [
    {'group': 'nexmo',
     'reduction': messageParts.filter((m) => (m.service == 'nexmo'))
    },
    {'group': 'twilio',
     'reduction': messageParts.filter((m) => (m.service == 'twilio'))
    },
  ]
  const serviceLength = messagePartsByService.length
  for (let index = 0; index < serviceLength; index++) {
    const serviceParts = messagePartsByService[index]
    const allParts = serviceParts.reduction
    const allPartsCount = allParts.length
    if (allPartsCount == 0) {
      continue
    }
    const service = serviceMap[serviceParts.group]
    const convertMessageParts = service.convertMessagePartsToMessage
    const messagesToSave = []
    let messagePartsToDelete = []
    const concatMessageParts = {}
    for (let i = 0; i < allPartsCount; i++) {
      const part = allParts[i]
      const serviceMessageId = part.service_id
      const savedCount = await r.table('message')
        .getAll(serviceMessageId, { index: 'service_id' })
        .count()
      const lastMessage = await getLastMessage({
        contactNumber: part.contact_number,
        service: serviceParts.group
      })
      const duplicateMessageToSaveExists = !!messagesToSave.find((message) => message.service_id === serviceMessageId)
      if (!lastMessage) {
        log.info('Received message part with no thread to attach to', part)
        messagePartsToDelete.push(part)
      } else if (savedCount > 0) {
        log.info(`Found already saved message matching part service message ID ${part.service_id}`)
        messagePartsToDelete.push(part)
      } else if (duplicateMessageToSaveExists) {
        log.info(`Found duplicate message to be saved matching part service message ID ${part.service_id}`)
        messagePartsToDelete.push(part)
      } else {
        const parentId = part.parent_id
        if (!parentId) {
          messagesToSave.push(await convertMessageParts([part]))
          messagePartsToDelete.push(part)
        } else {
          if (part.service !== 'nexmo') {
            throw new Error('should not have a parent ID for twilio')
          }
          const groupKey = [parentId, part.contact_number, part.user_number]
          const serviceMessage = JSON.parse(part.service_message)
          if (!concatMessageParts.hasOwnProperty(groupKey)) {
            const partCount = parseInt(serviceMessage['concat-total'], 10)
            concatMessageParts[groupKey] = Array(partCount).fill(null)
          }

          const partIndex = parseInt(serviceMessage['concat-part'], 10) - 1
          if (concatMessageParts[groupKey][partIndex] !== null) {
            messagePartsToDelete.push(part)
          } else {
            concatMessageParts[groupKey][partIndex] = part
          }
        }
      }
    }
    const keys = Object.keys(concatMessageParts)
    const keyCount = keys.length

    for (let i = 0; i < keyCount; i++) {
      const groupKey = keys[i]
      const messageParts = concatMessageParts[groupKey]

      if (messageParts.filter((part) => part === null).length === 0) {
        messagePartsToDelete = messagePartsToDelete.concat(messageParts)
        const message = await convertMessageParts(messageParts)
        messagesToSave.push(message)
      }
    }

    const messageCount = messagesToSave.length
    for (let i = 0; i < messageCount; i++) {
      log.info('Saving message with service message ID', messagesToSave[i].service_id)
      await saveNewIncomingMessage(messagesToSave[i])
    }

    const messageIdsToDelete = messagePartsToDelete.map((m) => m.id)
    log.info('Deleting message parts', messageIdsToDelete)
    await r.table('pending_message_part')
      .getAll(...messageIdsToDelete)
      .delete()
  }
}
