import { Assignments } from '../assignments/assignments.js'
import { convertRowToContact } from '../campaign_contacts/parse_csv'
import { chunk, forEach, zip } from 'lodash'
import { batchInsert } from 'meteor/mikowals:batch-insert'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { InteractionSteps } from '../interaction_steps/interaction_steps'
const divideContacts = (contactIds, texters) => {
  console.log(contactIds, texters)
  const rowCount = contactIds.length
  const texterCount = texters.length

  const chunkSize = Math.max(Math.floor(rowCount / texterCount), 1)

  const chunked = chunk(contactIds, chunkSize)

  if (rowCount > texterCount && rowCount % texterCount > 0) {
    const leftovers = chunked.pop()
    forEach(leftovers, (leftover, index) => chunked[index].push(leftover))
  }

  return zip(texters.slice(0, chunked.length), chunked)
}

const updateAssignments = ({ dueBy, campaignId, texterId, texterContactIds }) => {
  const assignment = Assignments.findOne({ campaignId, userId: texterId })
  const assignmentId = assignment ? assignment._id : Assignments.insert({ campaignId, dueBy, createdAt: new Date(), userId: texterId })
  CampaignContacts.update({ _id: { $in: texterContactIds } }, { $set: { assignmentId } }, { multi: true })
}

export const saveQuestions = (campaignId, interactionSteps) => {
  for (let interactionStep of interactionSteps) {
    interactionStep.campaignId = campaignId
    InteractionSteps.insert(interactionStep)
  }
}

export const saveContacts = (campaignId, contactRows) => {
  CampaignContacts.remove({ campaignId })

  const data = contactRows.map((row) => {
    const contact = convertRowToContact(row)
    contact.campaignId = campaignId
    contact.createdAt = new Date()
    return contact
  })

  CampaignContacts.batchInsert(data)
}

export const assignContacts = (campaignId, dueBy, assignedTexters) => {
  const contacts = CampaignContacts.find({ campaignId, lastMessage: null }, { fields: {} }).fetch()
  const contactIds = _.map(contacts, ({ _id }) => _id)
  console.log("contactIds", contactIds)
  const dividedContacts = divideContacts(contactIds, assignedTexters)
  forEach(dividedContacts, ([texterId, texterContactIds]) => {
    console.log("updateAssignments")
    updateAssignments({ dueBy, campaignId, texterId, texterContactIds })
  })
}
