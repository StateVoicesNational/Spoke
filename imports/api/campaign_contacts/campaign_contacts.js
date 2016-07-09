import { Mongo } from 'meteor/mongo'
import { Factory } from 'meteor/dburles:factory'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { ZipCodes } from '../zip_codes/zip_codes'
import { SurveyAnswers } from '../survey_answers/survey_answers'
import { Messages } from '../messages/messages'
import { Campaigns } from '../campaigns/campaigns'
import { OptOuts } from '../opt_outs/opt_outs'

export const CampaignContacts = new Mongo.Collection('campaign_contacts')

// Deny all client-side updates since we will be using methods to manage this collection
CampaignContacts.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

const LastMessageSchema = new SimpleSchema({
  isFromContact: { type: Boolean },
  closed: { type: Boolean, optional: true}
})

CampaignContacts.schema = new SimpleSchema({
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  campaignId: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  cell: { type: String },
  customFields: { type: Object, blackbox: true },
  createdAt: { type: Date },
  assignmentId: {
    type: String,
    optional: true
  }, // so we can tell easily what is unassigned

  // Cached last Message
  lastMessage: {
    type: LastMessageSchema,
    optional: true
  },
})

// FIXME: Add unformattedCell
CampaignContacts.attachSchema(CampaignContacts.schema)
CampaignContacts.requiredUploadFields = ['firstName', 'lastName', 'cell']
CampaignContacts.topLevelUploadFields = ['firstName', 'lastName', 'cell', 'zip']
CampaignContacts.userScriptFields = ['texterFirstName', 'texterLastName']

Factory.define('campaign_contact', CampaignContacts, {
  campaignId: () => Factory.get('campaign'),
  firstName: () => Fake.user({ fields: ['name'] }).name,
  lastName: () => Fake.user({ fields: ['surname'] }).surname,
  state: () => Fake.fromArray(['CA', 'DE', 'MN', 'IL', 'TX', 'NY', 'HI']),
  cell: '669-221-6251',
  customFields: () => {
    const fields = {}
    fields[Fake.word()] = Fake.sentence(2)
    return fields
  },
  createdAt: () => new Date(),
  assignmentId: () => Factory.get('assignment'),
  optOut: false
})

// This represents the keys from CampaignContacts objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
CampaignContacts.publicFields = {
}

CampaignContacts.helpers({
  needsResponse() {
    return this.lastMessage && this.lastMessage.isFromContact && !this.lastMessage.closed
  },
  zipDatum() {
    return ZipCodes.findOne({ zip: this.zip })
  },
  utcOffset() {
    const zip = this.zipDatum()
    return zip ? zip.timezoneOffset : null
  },
  campaign() {
    return Campaigns.findOne(this.campaignId)
  },
  messages() {
    return Messages.find({ contactNumber: this.cell, campaignId: this.campaignId })
  },
  optOut() {
    const campaign = Campaigns.findOne({_id: this.campaignId})
    return OptOuts.findOne({ organizationId: campaign.organizationId, cell: this.cell})
  },
  surveyAnswer(interactionStepId) {
    return SurveyAnswers.findOne({
      interactionStepId,
      campaignContactId: this._id
    })
  }
})
