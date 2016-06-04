import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { CampaignContacts } from './campaign_contacts.js'
import { Assignments } from '../assignments/assignments.js'

export const ContactFilters = {
  UNMESSAGED: 'unmessaged',
  UNREPLIED: 'unreplied'
}

export const getContactsToText = new ValidatedMethod({
  name: 'campaignContacts.getContactsToText',
  validate: new SimpleSchema({
    assignmentId: {type: String},
    contactFilter: {
      type: String,
      allowedValues: [ContactFilters.UNMESSAGED, ContactFilters.UNREPLIED]
    }
  }).validator(),
  run({ assignmentId, contactFilter }) {
    let query
    if (contactFilter === ContactFilters.UNMESSAGED) {
      query = { assignmentId, lastMessage: null }
    } else if (contactFilter === ContactFilters.UNREPLIED) {
      query = { assignmentId, 'lastMessage.isFromContact': true }
    }
    return CampaignContacts.find(query).fetch()
  }
})

// TODO We don't actually want to loop this -- we want to bulk insert
export const insertContact = new ValidatedMethod({
  name: 'campaignContacts.insert',
  validate: new SimpleSchema({
    campaignId: { type: String },
    assignmentId: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    cell: { type: String },
    customFields: { type: Object, blackbox: true },
  }).validator(),
  run(contact) {
    contact.createdAt = new Date()

    if (Meteor.server){
      const { e164} = require('libphonenumber')
      e164(contact.cell, 'US', (error, result) => {
        if (error) {
        }
        else {
          contact.cell = result
          CampaignContacts.insert(contact)
        }
      })
    }

  }
})

export const updateSurveyResponse = new ValidatedMethod({
  name: 'campaignContacts.updateSurveyResponse',
  validate: new SimpleSchema({
    campaignContactId: { type: String },
    campaignSurveyId: { type: String },
  }).validator(),
  run({ campaignContactId, campaignSurveyId }) {
    const campaignContact = CampaignContacts.findOne(campaignContactId)

    CampaignContacts.update(campaignContactId, { $set: {
      campaignSurveyId
    } })
  }
})
