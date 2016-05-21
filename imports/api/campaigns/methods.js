import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { insertContact } from '../campaign_contacts/methods'

import { Campaigns } from './campaigns.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { Assignments } from '../assignments/assignments.js'
import { convertRowToContact } from '../campaign_contacts/parse_csv'

import { chunk, last, forEach, zip } from 'lodash'

const divideContacts = (contactRows, texters) => {

  const rowCount = contactRows.length
  const texterCount = texters.length

  const chunkSize = Math.floor(rowCount / texterCount)

  const chunked = chunk(contactRows, chunkSize)
  if (rowCount % texterCount > 0) {
    const leftovers = chunked.pop()
    forEach(leftovers, (leftover, index) => chunked[index].push(leftover))
  }

  console.log("ASSIGEND", zip(texters, chunked))
  return zip(texters, chunked)
}

const createAssignment = (campaignId, userId, texterContacts) => {
  const assignmentData = {
    campaignId,
    userId,
    createdAt: new Date()
  }
  Assignments.insert(assignmentData, (assignmentError, assignmentId) => {
    if (assignmentError) {
      throw Meteor.error()
    }
    else {
      for (let row of texterContacts) {
        // TODO: Require upload in this format.

        const contact = convertRowToContact(row)
        contact.assignmentId = assignmentId
        contact.campaignId = campaignId

        // TODO BBulk insert instead of individual!
        insertContact.call(contact, (contactError) => {
          if (contactError) {
            console.log("failed to insert", contactError)
          }
          else {
            console.log("inserted contact?")
          }
        })
      }
    }
  })
}


// TODO I should actually do the campaignContact validation here so I don't have
// a chance of failing between campaign save and contact save
export const insert = new ValidatedMethod({
  name: 'campaigns.insert',
  validate: new SimpleSchema({
    title: { type: String },
    organizationId: { type: String },
    description: { type: String },
    contacts: { type: [Object], blackbox: true },
    script: { type: String },
    faqScripts: { type: [Object], blackbox: true}, // todo,
    assignedTexters: { type: [String]}

  }).validator(),
  run({ title, description, contacts, script, faqScripts, organizationId, assignedTexters }) {
    const campaignData = {
      title,
      description,
      script,
      faqScripts,
      organizationId,
      createdAt: new Date(),
      customFields: ['hi', 'bye', 'smee']       // FIXMe
    };

    // TODO do this only if the contacts validate!
    Campaigns.insert(campaignData, (campaignError, campaignId) => {
      // TODO - autoassignment alternative
      // TODO check error!

      console.log("assignedTexters in campaign insert", assignedTexters)
      const dividedContacts = divideContacts(contacts, assignedTexters)
      forEach(dividedContacts, ( [texterId, texterContacts] ) => {
        createAssignment(campaignId, texterId, texterContacts)
      })
    })
  }
})