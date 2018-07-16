import { r, datawarehouse, Assignment, Campaign, CampaignContact, Organization, User } from '../server/models'
import { log, gunzip, zipToTimeZone, convertOffsetsToStrings } from '../lib'
import { updateJob } from './lib'
import serviceMap from '../server/api/lib/services'
import { getLastMessage, saveNewIncomingMessage } from '../server/api/lib/message-sending'

import AWS from 'aws-sdk'
import Papa from 'papaparse'
import moment from 'moment'
import { sendEmail } from '../server/mail'
import { Notifications, sendUserNotification } from '../server/notifications'

const zipMemoization = {}

export async function getTimezoneByZip(zip) {
  if (zip in zipMemoization) {
    return zipMemoization[zip]
  }
  const rangeZip = zipToTimeZone(zip)
  if (rangeZip) {
    return `${rangeZip[2]}_${rangeZip[3]}`
  }
  const zipDatum = await r.table('zip_code').get(zip)
  if (zipDatum && zipDatum.timezone_offset && zipDatum.has_dst) {
    zipMemoization[zip] = convertOffsetsToStrings([[zipDatum.timezone_offset, zipDatum.has_dst]])[0]
    return zipMemoization[zip]
  }
  return ''
}

export async function sendJobToAWSLambda(job) {
  // job needs to be json-serializable
  // requires a 'command' key which should map to a function in job-processes.js
  console.log('LAMBDA INVOCATION STARTING', job, process.env.AWS_LAMBDA_FUNCTION_NAME)

  if (!job.command) {
    console.log('LAMBDA INVOCATION FAILED: JOB NOT INVOKABLE', job)
    return Promise.reject('Job type not available in job-processes')
  }
  const lambda = new AWS.Lambda()
  const lambdaPayload = JSON.stringify(job)
  if (lambdaPayload.length > 128000) {
    console.log('LAMBDA INVOCATION FAILED PAYLOAD TOO LARGE')
    return Promise.reject('Payload too large')
  }

  const p = new Promise((resolve, reject) => {
    const result = lambda.invoke({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: 'Event',
      Payload: lambdaPayload
    }, (err, data) => {
      if (err) {
        console.log('LAMBDA INVOCATION FAILED', err, job)
        reject(err)
      } else {
        resolve(data)
      }
    })
    console.log('LAMBDA INVOCATION RESULT', result)
  })
  return p
}

export async function processSqsMessages() {
  // hit endpoint on SQS
  // ask for a list of messages from SQS (with quantity tied to it)
  // if SQS has messages, process messages into pending_message_part and dequeue messages (mark them as handled)
  // if SQS doesnt have messages, exit

  if (!process.env.TWILIO_SQS_QUEUE_URL) {
    return Promise.reject('TWILIO_SQS_QUEUE_URL not set')
  }

  const sqs = new AWS.SQS()

  const params = {
    QueueUrl: process.env.TWILIO_SQS_QUEUE_URL,
    AttributeNames: ['All'],
    MessageAttributeNames: ['string'],
    MaxNumberOfMessages: 10,
    VisibilityTimeout: 60,
    WaitTimeSeconds: 10,
    ReceiveRequestAttemptId: 'string'
  }

  const p = new Promise((resolve, reject) => {
    sqs.receiveMessage(params, async (err, data) => {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else if (data.Messages) {
        console.log(data)
        for (let i = 0; i < data.Messages.length; i ++) {
          const message = data.Messages[i]
          const body = message.Body
          console.log('processing sqs queue:', body)
          const twilioMessage = JSON.parse(body)

          await serviceMap.twilio.handleIncomingMessage(twilioMessage)

          sqs.deleteMessage({ QueueUrl: process.env.TWILIO_SQS_QUEUE_URL, ReceiptHandle: message.ReceiptHandle },
                            (delMessageErr, delMessageData) => {
                              if (delMessageErr) {
                                console.log(delMessageErr, delMessageErr.stack) // an error occurred
                              } else {
                                console.log(delMessageData) // successful response
                              }
                            })
        }
        resolve()
      }
    })
  })
  return p
}

export async function uploadContacts(job) {
  const campaignId = job.campaign_id
  // We do this deletion in schema.js but we do it again here just in case the the queue broke and we had a backlog of contact uploads for one campaign
  const campaign = await Campaign.get(campaignId)
  const organization = await Organization.get(campaign.organization_id)
  const orgFeatures = JSON.parse(organization.features || '{}')

  const jobMessages = []

  await r.table('campaign_contact')
    .getAll(campaignId, { index: 'campaign_id' })
    .delete()
  const maxPercentage = 100
  let contacts = await gunzip(new Buffer(job.payload, 'base64'))
  const chunkSize = 1000
  contacts = JSON.parse(contacts)

  const maxContacts = parseInt(orgFeatures.hasOwnProperty('maxContacts')
                                ? orgFeatures.maxContacts
                                : process.env.MAX_CONTACTS || 0, 10)

  if (maxContacts) { // note: maxContacts == 0 means no maximum
    contacts = contacts.slice(0, maxContacts)
  }

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

  const optOutCellCount = await r.knex('campaign_contact')
    .whereIn('cell', function optouts() {
      this.select('cell').from('opt_out').where('organization_id', campaign.organization_id)
    })
    .where('campaign_id', campaignId)
    .delete()

  if (optOutCellCount) {
    jobMessages.push(`Number of contacts excluded due to their opt-out status: ${optOutCellCount}`)
  }

  if (job.id) {
    if (jobMessages.length) {
      await r.knex('job_request').where('id', job.id)
        .update({ result_message: jobMessages.join('\n') })
    } else {
      await r.table('job_request').get(job.id).delete()
    }
  }
}

export async function loadContactsFromDataWarehouseFragment(jobEvent) {
  console.log('starting loadContactsFromDataWarehouseFragment', jobEvent)
  let sqlQuery = jobEvent.query
  if (jobEvent.limit) {
    sqlQuery += ' LIMIT ' + jobEvent.limit
  }
  if (jobEvent.offset) {
    sqlQuery += ' OFFSET ' + jobEvent.offset
  }
  let knexResult
  try {
    console.log('loadContactsFromDataWarehouseFragment RUNNING WAREHOUSE query', sqlQuery)
    knexResult = await datawarehouse.raw(sqlQuery)
  } catch (err) {
    // query failed
    log.error('Data warehouse query failed: ', err)
    // TODO: send feedback about job
  }
  const fields = {}
  const customFields = {}
  const contactFields = {
    first_name: 1,
    last_name: 1,
    cell: 1,
    zip: 1,
    external_id: 1
  }
  knexResult.fields.forEach((f) => {
    fields[f.name] = 1
    if (! (f.name in contactFields)) {
      customFields[f.name] = 1
    }
  })
  if (! ('first_name' in fields && 'last_name' in fields && 'cell' in fields)) {
    log.error('SQL statement does not return first_name, last_name, and cell: ', sqlQuery, fields)
    return
  }

  const jobMessages = []
  const savePortion = await Promise.all(knexResult.rows.map(async (row) => {
    const contact = {
      campaign_id: jobEvent.campaignId,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      cell: row.cell,
      zip: row.zip || '',
      external_id: (row.external_id ? String(row.external_id) : ''),
      assignment_id: null,
      message_status: 'needsMessage'
    }
    const contactCustomFields = {}
    Object.keys(customFields).forEach((f) => {
      contactCustomFields[f] = row[f]
    })
    contact.custom_fields = JSON.stringify(contactCustomFields)
    if (contact.zip) {
      contact.timezone_offset = await getTimezoneByZip(contact.zip)
    }
    return contact
  }))

  await CampaignContact.save(savePortion)

  await r.knex('job_request').where('id', jobEvent.jobId).increment('status', 1)

  const completed = (await r.knex('job_request')
                     .where('id', jobEvent.jobId)
                     .select('status')
                     .first())
  console.log('loadContactsFromDataWarehouseFragment toward end', completed, jobEvent)

  if (jobEvent.totalParts && completed.status >= jobEvent.totalParts) {
    if (jobEvent.organizationId) {
      // now that we've saved them all, we delete everyone that is opted out locally
      // doing this in one go so that we can get the DB to do the indexed cell matching
      const optOutCellCount = await r.knex('campaign_contact')
        .whereIn('cell', function optouts() {
          this.select('cell').from('opt_out').where('organization_id', jobEvent.organizationId)
        })
        .where('campaign_id', jobEvent.campaignId)
        .delete()
      console.log('OPTOUT CELL COUNT', optOutCellCount)
    }
    await r.table('job_request').get(jobEvent.jobId).delete()
  } else if (jobEvent.part < (jobEvent.totalParts - 1)) {
    const newPart = jobEvent.part + 1
    const newJob = {
      ...jobEvent,
      part: newPart,
      offset: newPart * jobEvent.step,
      limit: jobEvent.step,
      command: 'loadContactsFromDataWarehouseFragmentJob'
    }
    if (process.env.WAREHOUSE_DB_LAMBDA_ITERATION) {
      console.log('SENDING TO LAMBDA loadContactsFromDataWarehouseFragment', newJob)
      await sendJobToAWSLambda(newJob)
    } else {
      loadContactsFromDataWarehouseFragment(newJob)
    }
  }
}

export async function loadContactsFromDataWarehouse(job) {
  console.log('STARTING loadContactsFromDataWarehouse')
  const jobMessages = []
  const sqlQuery = job.payload
  if (!sqlQuery.startsWith('SELECT') || sqlQuery.indexOf(';') >= 0) {
    log.error('Malformed SQL statement.  Must begin with SELECT and not have any semicolons: ', sqlQuery)
    return
  }
  if (!datawarehouse) {
    log.error('No data warehouse connection, so cannot load contacts', job)
    return
  }

  let knexCountRes
  let knexCount
  try {
    knexCountRes = await datawarehouse.raw(`SELECT COUNT(*) FROM ( ${sqlQuery} )`)
  } catch (err) {
    log.error('Data warehouse count query failed: ', err)
    jobMessages.push(`Error: Data warehouse count query failed: ${err}`)
  }

  if (knexCountRes) {
    knexCount = knexCountRes.rows[0].count
    console.log('WAREHOUSE COUNT', knexCount)
  }
  if (!knexCount) {
    jobMessages.push('Error: Data warehouse query returned zero results')
  }
  const STEP = ((r.kninky && r.kninky.defaultsUnsupported)
                ? 10 // sqlite has a max of 100 variables and ~8 or so are used per insert
                : 10000) // default
  const campaign = await Campaign.get(job.campaign_id)
  const totalParts = Math.ceil(knexCount / STEP)

  if (totalParts > 1 && /LIMIT/.test(sqlQuery)) {
    jobMessages.push(`Error: LIMIT in query not supported for results larger than ${STEP}. Count was ${knexCount}`)
  }

  if (job.id && jobMessages.length) {
    await r.knex('job_request').where('id', job.id)
      .update({ result_message: jobMessages.join('\n') })
    return
  }

  await r.knex('campaign_contact')
    .where('campaign_id', job.campaign_id)
    .delete()

  console.log('STARTING loadContactsFromDataWarehouse')

  await loadContactsFromDataWarehouseFragment({
    jobId: job.id,
    query: sqlQuery,
    campaignId: job.campaign_id,
    // beyond job object:
    organizationId: campaign.organization_id,
    totalParts,
    totalCount: knexCount,
    step: STEP,
    part: 0,
    limit: (totalParts > 1 ? STEP : 0) // 0 is unlimited
  })
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
  const campaign = (await r.knex('campaign').where({ id: cid }))[0]
  const texters = payload.texters
  const currentAssignments = await r.knex('assignment')
    .where('assignment.campaign_id', cid)
    .joinRaw('left join campaign_contact allcontacts'
             + ' ON (allcontacts.assignment_id = assignment.id)')
    .groupBy('user_id', 'assignment.id')
    .select('user_id',
            'assignment.id as id',
            r.knex.raw("SUM(CASE WHEN allcontacts.message_status = 'needsMessage' THEN 1 ELSE 0 END) as needs_message_count"),
            r.knex.raw('COUNT(allcontacts.id) as full_contact_count')
           )
    .catch(log.error)

  const unchangedTexters = {}
  const demotedTexters = {}

  // changedAssignments:
  currentAssignments.map((assignment) => {
    const texter = texters.filter((ele) => parseInt(ele.id, 10) === assignment.user_id)[0]
    if (texter && texter.needsMessageCount === parseInt(assignment.needs_message_count, 10)) {
      unchangedTexters[assignment.user_id] = true
      return null
    } else if (texter) { // assignment change
      // If there is a delta between client and server, then accomodate delta (See #322)
      const clientMessagedCount = texter.contactsCount - texter.needsMessageCount
      const serverMessagedCount = assignment.full_contact_count - assignment.needs_message_count

      const numDifferent = ((texter.needsMessageCount || 0)
                            - assignment.needs_message_count
                            - Math.max(0, serverMessagedCount - clientMessagedCount))

      if (numDifferent < 0) { // got less than before
        demotedTexters[assignment.id] = -numDifferent
      } else { // got more than before: assign the difference
        texter.needsMessageCount = numDifferent
      }
      return assignment
    } else { // new texter
      return assignment
    }
  }).filter((ele) => ele !== null)

  for (const assignId in demotedTexters) {
    // Here we demote ALL the demotedTexters contacts (not just the demotion count)
    // because they will get reapportioned below
    await r.knex('campaign_contact')
      .where('id', 'in',
             r.knex('campaign_contact')
             .where('assignment_id', assignId)
             .where('message_status', 'needsMessage')
             .select('id')
            )
      .update({ assignment_id: null })
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
    const texterId = parseInt(texter.id, 10)
    const maxContacts = parseInt(texter.maxContacts || 0, 10)
    if (unchangedTexters[texterId]) {
      continue
    }
    const contactsToAssign = Math.min(availableContacts, texter.needsMessageCount)
    if (contactsToAssign === 0) {
      // avoid creating a new assignment when the texter should get 0
      if (!campaign.use_dynamic_assignment) {
        continue
      }
    }
    availableContacts = availableContacts - contactsToAssign
    const existingAssignment = currentAssignments.find((ele) => ele.user_id === texterId)
    let assignment = null
    if (existingAssignment) {
      assignment = new Assignment({ id: existingAssignment.id,
                                   user_id: existingAssignment.user_id,
                                   campaign_id: cid })
    } else {
      assignment = await new Assignment({
        user_id: texterId,
        campaign_id: cid,
        max_contacts: parseInt(maxContacts || process.env.MAX_CONTACTS_PER_TEXTER || 0, 10)
      }).save()
    }

    if (!campaign.use_dynamic_assignment) {
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
    }

    await updateJob(job, Math.floor((75 / texterCount) * (index + 1)) + 20)
  }

  if (!campaign.use_dynamic_assignment) {
    // dynamic assignments, having zero initially initially is ok
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
  }


  if (job.id) {
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
            // user fields
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
          if (response.interaction_step_id === parseInt(stepId, 10)) {
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
  const campaignCsv = Papa.unparse(finalCampaignResults)
  const messageCsv = Papa.unparse(finalCampaignMessages)

  if (process.env.AWS_ACCESS_AVAILABLE || (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
    try {
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
      }).catch((err) => {
        log.error(err)
        log.info(`Campaign Export URL - ${campaignExportUrl}`)
        log.info(`Campaign Messages Export URL - ${campaignMessagesExportUrl}`)
      })
      log.info(`Successfully exported ${id}`)
    } catch (err) {
      log.error(err)
      await sendEmail({
        to: user.email,
        subject: `Export failed for ${campaign.title}`,
        text: `Your Spoke exports failed... please try again later.
        Error: ${err.message}`
      })
    }
  } else {
    log.debug('Would have saved the following to S3:')
    log.debug(campaignCsv)
    log.debug(messageCsv)
  }

  if (job.id) {
    let retries = 0
    const deleteJob = async () => {
      try {
        await r.table('job_request').get(job.id).delete()
      } catch (err) {
        if (retries < 5) {
          retries += 1
          await deleteJob()
        } else log.error(`Could not delete job. Err: ${err.message}`)
      }
    }

    await deleteJob()
  } else log.debug(job)
}

// add an in-memory guard that the same messages are being sent again and again
// not related to stale filter
let pastMessages = []

export async function sendMessages(queryFunc, defaultStatus) {
  let messages = r.knex('message')
    .where({ send_status: defaultStatus || 'QUEUED' })

  if (queryFunc) {
    messages = queryFunc(messages)
  }
  messages = await messages.orderBy('created_at')

  for (let index = 0; index < messages.length; index++) {
    let message = messages[index]
    if (pastMessages.indexOf(message.id) !== -1) {
      throw new Error('Encountered send message request of the same message.'
                      + ' This is scary!  If ok, just restart process. Message ID: ' + message.id)
    }
    message.service = message.service || process.env.DEFAULT_SERVICE
    const service = serviceMap[message.service]
    log.info(`Sending (${message.service}): ${message.user_number} -> ${message.contact_number}\nMessage: ${message.text}`)
    await service.sendMessage(message)
    pastMessages.push(message.id)
    pastMessages = pastMessages.slice(-100) // keep the last 100
  }
}

export async function handleIncomingMessageParts() {
  const messageParts = await r.table('pending_message_part').limit(100)
  const messagePartsByService = {}
  messageParts.forEach((m) => {
    if (m.service in serviceMap) {
      if (!(m.service in messagePartsByService)) {
        messagePartsByService[m.service] = []
      }
      messagePartsByService[m.service].push(m)
    }
  })
  for (const serviceKey in messagePartsByService) {
    let allParts = messagePartsByService[serviceKey]
    const service = serviceMap[serviceKey]
    if (service.syncMessagePartProcessing) {
      // filter for anything older than ten minutes ago
      const tenMinutesAgo = new Date(new Date() - 1000 * 60 * 10)
      allParts = allParts.filter((part) => (part.created_at < tenMinutesAgo))
    }
    const allPartsCount = allParts.length
    if (allPartsCount === 0) {
      continue
    }

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
        service: serviceKey
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

export async function clearOldJobs(delay) {
  // to clear out old stuck jobs
  const twoHoursAgo = new Date(new Date() - 1000 * 60 * 60 * 2)
  delay = delay || twoHoursAgo
  return await r.knex('job_request')
    .where({ assigned: true })
    .where('updated_at', '<', delay)
    .delete()
}
