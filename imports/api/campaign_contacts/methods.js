import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { CampaignContacts } from './campaign_contacts.js'
import { Assignments, contactsForAssignmentCursor } from '../assignments/assignments.js'

export const ContactFilters = {
  UNMESSAGED: 'unmessaged',
  UNREPLIED: 'unreplied'
}


export const getContactsToText = new ValidatedMethod({
  name: 'campaignContacts.getContactsToText',
  validate: new SimpleSchema({
    assignmentId: { type: String },
    organizationId: { type: String },
    contactFilter: {
      type: String,
      allowedValues: [ContactFilters.UNMESSAGED, ContactFilters.UNREPLIED]
    }
  }).validator(),
  run({ assignmentId, contactFilter }) {
    return contactsForAssignmentCursor(assignmentId, contactFilter, organizationId).fetch()
  }
})

export const wrappedGetContactsToText = Meteor.wrapAsync(getContactsToText)


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
