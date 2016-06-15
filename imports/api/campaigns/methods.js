import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Campaigns } from './campaigns.js'
import { assignContacts, saveContacts, saveCampaignSurveys } from './assignment.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { ScriptSchema } from './scripts.js'

export const insert = new ValidatedMethod({
  name: 'campaigns.insert',
  validate: new SimpleSchema({
    title: { type: String },
    organizationId: { type: String },
    description: { type: String },
    contacts: { type: [Object], blackbox: true },
    scripts: { type: [ScriptSchema] },
    assignedTexters: { type: [String]},
    surveys: { type: [Object], blackbox: true},
    customFields: { type: [String]},
    dueBy: { type: Date }
  }).validator(),
  run({
    title,
    description,
    contacts,
    scripts,
    customFields,
    organizationId,
    assignedTexters,
    surveys,
    dueBy
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized');
    }

    const campaignData = {
      title,
      description,
      scripts,
      organizationId,
      customFields,
      dueBy,
      createdAt: new Date(),
    }

    // TODO this needs to be in one transaction
    const campaignId = Campaigns.insert(campaignData)
    saveCampaignSurveys(campaignId, surveys)
    saveContacts(campaignId, contacts)
    assignContacts(campaignId, dueBy, assignedTexters)
    return campaignId
  }
})

export const update = new ValidatedMethod({
  name: 'campaigns.update',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    title: { type: String },
    description: { type: String },
    dueBy: { type: Date },
    assignedTexters: { type: [String]},
    scripts: { type: [ScriptSchema] },
    contacts: { type: [Object], blackbox: true },
    surveys: { type: [Object], blackbox: true},
    customFields: { type: [String]},
  }).validator(),
  run({
    organizationId,
    campaignId,
    title,
    description,
    dueBy,
    scripts,
    customFields,
    contacts,
    assignedTexters,
    // surveys,
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized');
    }

    // TODO: If campaign has a message, throw not-authorized for editing contacts or surveys
    Campaigns.update({ _id: campaignId }, { $set: { title, description, dueBy, scripts, customFields }})
    if (contacts.length > 0) {
      // TODO: Validate the presence of new contats to upload
      saveContacts(campaignId, contacts)
    }
    assignContacts(campaignId, dueBy, assignedTexters)
    return campaignId
  }
})


export const exportContacts = new ValidatedMethod({
  name: 'campaign.export',
  validate: new SimpleSchema({
    campaignId: { type: String },
  }).validator(),
  run({ campaignId }) {

    // TODO:
    if (Meteor.isServer) {
        const campaign = Campaigns.findOne( { _id: campaignId })
        const organizationId = campaign.organizationId

        const surveyQuestions = campaign.surveys().fetch()
        if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
          throw new Meteor.Error('not-authorized');
        }

        const data = []
        const contacts = CampaignContacts.find( { campaignId }).fetch()

        for (let contact of contacts) {
          let row = {}
          for (let requiredField of CampaignContacts.requiredUploadFields) {
            row[requiredField] = contact.requiredField
          }

          row = _.extend(row, contact.customFields)
          row.optOut = !!contact.optOut()

          _.each(surveyQuestions, (question, index) => {
            row[`question ${index + 1}`] = question.text
            const answer = contact.surveyAnswer(question._id)
            row[`answer ${index + 1}`] = answer ? answer.value : ''
          })

          data.push(row)
        }

        return data
      }

    }
})