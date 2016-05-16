import { Assignments } from '../../api/assignments/assignments.js'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts.js'
import { SurveyQuestions } from '../../api/survey_questions/survey_questions.js'
import { SurveyAnswers } from '../../api/survey_answers/survey_answers.js'
import { Messages } from '../../api/messages/messages.js'

import { Fake } from 'meteor/anti:fake'
import { Meteor } from 'meteor/meteor'
import { Factory } from 'meteor/dburles:factory'
import { _ } from 'meteor/underscore'

const removeData = () => {
  Assignments.remove({})
  Campaigns.remove({})
  CampaignContacts.remove({})
  SurveyQuestions.remove({})
  SurveyAnswers.remove({})
  Messages.remove({})
}

const createContacts = (assignmentId, campaignId) => {

  const cells = [
    Meteor.settings.private.plivo.testPhoneNumbers.saikat,
    Meteor.settings.private.plivo.testPhoneNumbers.sheena
  ]
  const eventUrl = `http://bit.ly/${Fake.word(8)}`

  cells.forEach((cell) =>
    Factory.create('campaign_contact', {
      assignmentId,
      campaignId,
      cell,
      customFields: { eventUrl } })
  )
}

const allowedAnswer = (value, script, surveyQuestionId) => (
  {
    value,
    surveyQuestionId,
    script: `${script} Let us know at {eventUrl}!` // Just to demo/test the interpolation
  }
)

const createSurvey = (campaignId) => {

  const newSurvey = (question, allowedAnswers) => {
    return Factory.create('survey_question', {
      question,
      allowedAnswers,
    })
  }

  // Allow interpolation of scripts with <<answer>>
  const grandChildAnswers = [
    allowedAnswer('CA', 'See you in CA!'),
    allowedAnswer('DE', 'See you there!')
  ]

  const grandChildSurvey = newSurvey('What state for phonebanking?', grandChildAnswers)
  const childAnswers = [
    allowedAnswer('Yes', 'Great, thank you! What state can you help with?', grandChildSurvey._id),
    allowedAnswer('No', 'Ok, thought we would give it a shot!')
  ]

  const childSurvey = newSurvey('Can the supporter help phonebank?', childAnswers)

  const parentAnswers = [
    allowedAnswer('Yes', 'Great, please sign up on the website!'),
    allowedAnswer('No', 'Ok, no problem. Do you think you can phonebank instead?', childSurvey._id)
  ]

  return newSurvey('Can the supporter attend this event?', parentAnswers)
}

const createAssignment = () => {

  const survey = createSurvey()

  const customFields = ['eventUrl']
  const campaign = Factory.create('campaign', { customFields, surveyQuestionId:survey._id })


  const campaignId = campaign._id
  const assignment = Factory.create('assignment', {
    campaignId,
  })
  createContacts(assignment._id, campaignId)
}


Meteor.startup(() => {
  if (Meteor.settings.public.isProduction)
    return

  if (Meteor.settings.public.refreshTestData) {
    removeData()

    if (Assignments.find({}).count() === 0) {
      _(2).times(() => {
        createAssignment()
      })
    }
  }
})
