import { Meteor } from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Campaigns } from './campaigns.js'
import { Messages } from '../messages/messages'
import { assignContacts, saveContacts, saveQuestions } from './assignment.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { SurveyQuestions } from '../survey_questions/survey_questions.js'
import { Assignments } from '../assignments/assignments.js'
import { ScriptSchema } from './scripts.js'

export const insert = new ValidatedMethod({
  name: 'campaigns.insert',
  validate: new SimpleSchema({
    title: { type: String },
    organizationId: { type: String },
    description: { type: String },
    contacts: { type: [Object], blackbox: true },
    scripts: { type: [ScriptSchema] },
    questions: { type: [Object], blackbox: true },
    customFields: { type: [String] },
    assignedTexters: { type: [String] },
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
    questions,
    dueBy
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    const campaignData = {
      title,
      description,
      scripts,
      organizationId,
      customFields,
      dueBy,
      createdAt: new Date()
    }

    // TODO this needs to be in one transaction
    const campaignId = Campaigns.insert(campaignData)
    saveQuestions(campaignId, questions)
    saveContacts(campaignId, contacts)

    if (assignedTexters.length > 0) {
      assignContacts(campaignId, dueBy, assignedTexters)
    }
    return campaignId
  }
})

export const updateBasics = new ValidatedMethod({
  name: 'campaigns.updateBasics',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    title: { type: String },
    description: { type: String },
    dueBy: { type: Date }
  }).validator(),
  run({
    organizationId,
    campaignId,
    title,
    description,
    dueBy
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    console.log(campaignId, title, description, dueBy)
    Campaigns.update(campaignId, { $set: { title, description, dueBy } })
    return campaignId
  }
})

export const updateContacts = new ValidatedMethod({
  name: 'campaigns.updateContacts',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    contacts: { type: [Object], blackbox: true }
  }).validator(),
  run({
    organizationId,
    campaignId,
    contacts
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    const hasMessage = Messages.findOne({ campaignId })
    if (hasMessage) {
      throw new Meteor.Error(400, 'campaign-not-editable')
    }

    saveContacts(campaignId, contacts)
    const assignments = Assignments.find({ campaignId }, { fields: { userId: 1 } }).fetch()
    const assignedTexters = assignments.map((assignment) => assignment.userId)
    const { dueBy } = Campaigns.findOne(campaignId)
    assignContacts(campaignId, dueBy, assignedTexters)
  }
})

export const updateTexters = new ValidatedMethod({
  name: 'campaigns.updateTexters',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    assignedTexters: { type: [String] }
  }).validator(),
  run({
    organizationId,
    campaignId,
    assignedTexters
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }
    const { dueBy } = Campaigns.findOne(campaignId)
    assignContacts(campaignId, dueBy, assignedTexters)
  }
})

export const updateScripts = new ValidatedMethod({
  name: 'campaigns.updateScripts',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    scripts: { type: [ScriptSchema] }
  }).validator(),
  run({
    organizationId,
    campaignId,
    scripts
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    Campaigns.update(campaignId, { $set: { scripts } })
  }
})

export const updateQuestions = new ValidatedMethod({
  name: 'campaigns.updateQuestions',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    questions: { type: [Object], blackbox: true } // TODO: Survey schema?
  }).validator(),
  run({
    organizationId,
    campaignId,
    questions
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    saveQuestions(campaignId, questions)
  }
})

export const exportContacts = new ValidatedMethod({
  name: 'campaign.export',
  validate: new SimpleSchema({
    campaignId: { type: String }
  }).validator(),
  run({ campaignId }) {

    // TODO:
    if (Meteor.isServer) {
      const campaign = Campaigns.findOne({ _id: campaignId })
      const organizationId = campaign.organizationId

      const surveyQuestions = SurveyQuestions.find({ campaignId }).fetch()
      if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
        throw new Meteor.Error('not-authorized')
      }

      const data = []
      const contacts = CampaignContacts.find({ campaignId }).fetch()

      for (let contact of contacts) {
        let row = {}
        for (let field of CampaignContacts.topLevelUploadFields) {
          if (_.has(contact, field)) {
            row[field] = contact[field]
          }
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
