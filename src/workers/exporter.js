import { r } from '../server/models'
import { log } from '../lib'
import Baby from 'babyparse'
import moment from 'moment'

async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}
/*.merge((row) => ({
      contacts: r.table('campaign_contact')
        .getAll(row('id'), { index: 'assignment_id' })
    }))
    .merge((row) => ({
      messages: r.table('message')
        .getAll(row('id'), { index: 'assignment_id' })
    }))
    */
async function exportCampaign(id) {
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
  }
  const campaignCsv = Baby.unparse(finalCampaignResults)
  const messageCsv = Baby.unparse(finalCampaignMessages)
}

(async () => {
  while (true) {
    try {
      await sleep(1000)
      let exportJob = await r.table('job_request')
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
        await exportCampaign(exportJob.payload.id)
      }
    } catch (ex) {
      log.error(ex)
    }
  }
})()
