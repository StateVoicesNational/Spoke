import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { insertContact } from '../campaign_contacts/methods'

import { Campaigns } from './campaigns.js'
import { SurveyQuestions } from '../survey_questions/survey_questions.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { Assignments } from '../assignments/assignments.js'
import { convertRowToContact } from '../campaign_contacts/parse_csv'
import { batchInsert } from 'meteor/mikowals:batch-insert'
import { chunk, last, forEach, zip } from 'lodash'
import { ScriptSchema } from './scripts.js'

const divideContacts = (contactRows, texters) => {

  const rowCount = contactRows.length
  const texterCount = texters.length

  const chunkSize = Math.floor(rowCount / texterCount)

  const chunked = chunk(contactRows, chunkSize)
  if (rowCount % texterCount > 0) {
    const leftovers = chunked.pop()
    forEach(leftovers, (leftover, index) => chunked[index].push(leftover))
  }

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
      throw Meteor.Error(assignmentError)
    }
    else {
      // TODO can still batch insert
      const data = texterContacts.map((row) => {
        const contact = convertRowToContact(row)
        contact.assignmentId = assignmentId
        contact.campaignId = campaignId
        contact.createdAt = new Date()
        return contact
      })

      // FIXME - need to convert to e164 here
      // const { e164} = require('libphonenumber')
      // e164(contact.cell, 'US', (error, result) => {
      //   if (error) {
      //   }
      //   else {
      //     contact.cell = result
      //     CampaignContacts.insert(contact)
      //   }
      // })
      // validate schema
      CampaignContacts.batchInsert(data, (err, res) => console.log("ERROR creating contacts", err))


      // for (let row of texterContacts) {
      //   // TODO: Require upload in this format.

      //   const contact = convertRowToContact(row)
      //   contact.assignmentId = assignmentId
      //   contact.campaignId = campaignId

      //   // TODO BBulk insert instead of individual!
      //   insertContact.call(contact, (contactError) => {
      //     if (contactError) {
      //     }
      //     else {
      //     }
      //   })
      // }
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
    scripts: { type: [ScriptSchema] },
    assignedTexters: { type: [String]},
    surveys: { type: [Object], blackbox: true},
    customFields: { type: [String]}
  }).validator(),
  run({ title, description, contacts, scripts, customFields, organizationId, assignedTexters, surveys }) {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', organizationId)) {
      throw new Meteor.Error('not-authorized');
    }

    const campaignData = {
      title,
      description,
      scripts,
      organizationId,
      customFields,
      createdAt: new Date(),
    };

    // TODO this needs to be in one transaction
    // TODO do this only if the contacts validate!
    Campaigns.insert(campaignData, (campaignError, campaignId) => {
      if (campaignError) {
        throw new Meteor.Error(campaignError)
      }
      else {
        for (let survey of surveys) {
          survey.campaignId = campaignId
          SurveyQuestions.insert(survey)
        }
        const dividedContacts = divideContacts(contacts, assignedTexters)
        forEach(dividedContacts, ( [texterId, texterContacts] ) => {
          createAssignment(campaignId, texterId, texterContacts)
        })
      }
      // TODO - autoassignment alternative
      // TODO check error!

    })
  }
})

// TODO I should actually do the campaignContact validation here so I don't have
// a chance of failing between campaign save and contact save
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

        data = []
        const contacts = CampaignContacts.find( { campaignId }).fetch()

        for (let contact of contacts) {
          let row = {}
          for (let requiredField of CampaignContacts.requiredUploadFields) {
            row[requiredField] = contact.requiredField
          }

          row = _.extend(row, contact.customFields)
          row.optOut = !!contact.optOut()

          _.each(surveyQuestions, (survey, index) => {
            row[`question ${index + 1}`] = survey.question
            const answer = contact.surveyAnswer(survey._id)
            row[`answer ${index + 1}`] = answer ? answer.value : ''
          })

          data.push(row)
        }

        return data
      }

    }
})