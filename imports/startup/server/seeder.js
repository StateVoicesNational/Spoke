import { Assignments } from '../../api/assignments/assignments.js'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts.js'
import { SurveyQuestions } from '../../api/survey_questions/survey_questions.js'
import { SurveyAnswers } from '../../api/survey_answers/survey_answers.js'
import { Messages } from '../../api/messages/messages.js'
import { Organizations } from '../../api/organizations/organizations.js'
import { OptOuts } from '../../api/opt_outs/opt_outs.js'
import { Random } from 'meteor/random'

import { Fake } from 'meteor/anti:fake'
import { Meteor } from 'meteor/meteor'
import { Factory } from 'meteor/dburles:factory'
import { _ } from 'meteor/underscore'
import { Roles } from 'meteor/alanning:roles'
import { moment } from 'meteor/momentjs:moment'

const users = [
  {
    email: 'admin@test.com',
    roles: 'admin'
  },
  {
    email: 'texter1@test.com',
    roles: 'texter'
  },
  {
    email: 'texter2@test.com',
    roles: 'texter'
  }
]

const removeData = () => {
  Organizations.remove({})
  Assignments.remove({})
  Campaigns.remove({})
  CampaignContacts.remove({})
  SurveyQuestions.remove({})
  SurveyAnswers.remove({})
  Messages.remove({})
  OptOuts.remove({})
  Meteor.users.remove({})
}

const createContacts = (assignmentId, campaignId) => {

  const cells = Meteor.settings.private.plivo.testPhoneNumbers
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
    _id: Random.id(),
    value,
    surveyQuestionId,
    script: `${script} Let us know at {eventUrl}!` // Just to demo/test the interpolation
  }
)

const createSurvey = (campaignId) => {

  const newSurvey = (question, allowedAnswers) => {
    return Factory.create('survey_question', {
      question,
      campaignId,
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

const createCampaign = (data) => {
  const { organizationId, dueBy } = data
  const customFields = ['eventUrl']
  const campaign = Factory.create('campaign', {
    organizationId,
    dueBy,
    customFields,
  })
  createSurvey(campaign._id)
  return campaign
}

const createAssignment = (userId, campaign) => {
  const campaignId = campaign._id
  const assignment = Factory.create('assignment', {
    userId,
    campaignId: campaignId,
    dueBy: campaign.dueBy
  })
  createContacts(assignment._id, campaignId)
}

const createUser = (user, organizationId) => {
  const { email, roles } = user
  const userId = Accounts.createUser({
    email,
    firstName: Fake.user().name,
    lastName: Fake.user().surname,
    userNumber: Meteor.settings.private.plivo.fromPhoneNumber,
    password: 'test'
  })

  Roles.addUsersToRoles(userId, roles, organizationId)
  return userId
}

Meteor.startup(() => {
  // TODO this should be a separate settings file
  if (Meteor.settings.public.isProduction)
    return

  if (Meteor.settings.public.refreshTestData) {
    removeData()

    const organizationId = Factory.create('organization', { name: 'Bartlet For President' })._id

    const dueDates = [
      moment().add(3, 'months'),
      moment().add(2, 'months'),
      moment().add(1, 'months'),
      moment().add(-1, 'months'),
      moment().add(-2, 'months')
    ]
    const campaigns = dueDates.map((dueBy) => createCampaign({ organizationId, dueBy: dueBy.toDate() }))

    for (let userData of users) {
      const userId = createUser(userData, organizationId)
      _.each(campaigns, (campaign) => createAssignment(userId, campaign))
    }
  }
})
