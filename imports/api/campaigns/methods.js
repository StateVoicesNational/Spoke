import { Meteor } from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Campaigns } from './campaigns.js'
import { Messages } from '../messages/messages'
import { assignContacts, saveContacts, saveQuestions } from './assignment.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { InteractionSteps } from '../interaction_steps/interaction_steps.js'
import { Assignments } from '../assignments/assignments.js'
import { Scripts } from '../scripts/scripts.js'

const saveScripts = (scripts, campaignId) => {
  _.each(scripts, (script) => Scripts.insert(_.extend(script, { campaignId })))
}

export const insert = new ValidatedMethod({
  name: 'campaigns.insert',
  validate: new SimpleSchema({
    title: { type: String },
    organizationId: { type: String },
    description: { type: String },
    contacts: { type: [Object], blackbox: true },
    scripts: { type: [Object], blackbox: true },
    interactionSteps: { type: [Object], blackbox: true },
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
    interactionSteps,
    dueBy
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    const campaignData = {
      title,
      description,
      organizationId,
      customFields,
      dueBy,
      createdAt: new Date()
    }

    // TODO this needs to be in one transaction
    const campaignId = Campaigns.insert(campaignData)
    saveScripts(scripts, campaignId)
    saveQuestions(campaignId, interactionSteps)
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
    console.log("assignedTexters", assignedTexters)
    assignContacts(campaignId, dueBy, assignedTexters)
  }
})

export const updateScripts = new ValidatedMethod({
  name: 'campaigns.updateScripts',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    scripts: { type: [Object], blackbox: true }
  }).validator(),
  run({
    organizationId,
    campaignId,
    scripts
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    Scripts.remove({ campaignId, userId: null})
    saveScripts(scripts, campaignId)
  }
})

export const updateQuestions = new ValidatedMethod({
  name: 'campaigns.updateQuestions',
  validate: new SimpleSchema({
    campaignId: { type: String },
    organizationId: { type: String },
    interactionSteps: { type: [Object], blackbox: true } // TODO: Survey schema?
  }).validator(),
  run({
    organizationId,
    campaignId,
    interactionSteps
  }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized')
    }

    saveQuestions(campaignId, interactionSteps)
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

      const interactionSteps = InteractionSteps.find({ campaignId, question: {$ne: null} }).fetch()
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

        _.each(interactionSteps, (step, index) => {
          const answer = contact.surveyAnswer(step._id)
          row[step.question] = answer ? answer.value : ''
        })

        data.push(row)
      }

      return data
    }

  }
})
