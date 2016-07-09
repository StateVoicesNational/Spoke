import { Assignments } from '../assignments/assignments.js'
import { Campaigns } from '../campaigns/campaigns.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { InteractionSteps } from '../interaction_steps/interaction_steps.js'
import { SurveyAnswers } from '../survey_answers/survey_answers.js'
import { Messages } from '../messages/messages.js'
import { Organizations } from '../organizations/organizations.js'
import { OptOuts } from '../opt_outs/opt_outs.js'
import { Random } from 'meteor/random'

import { Fake } from 'meteor/anti:fake'
import { Meteor } from 'meteor/meteor'
import { Factory } from 'meteor/dburles:factory'
import { Roles } from 'meteor/alanning:roles'

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
  InteractionSteps.remove({})
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

const allowedAnswer = (value, interactionStepId) => (
  {
    _id: Random.id(),
    value,
    interactionStepId,
  }
)

const createStep = (campaignId) => {

  const newStep = (question, allowedAnswers, script, isTopLevel) => {
    return Factory.create('interaction_step', {
      question,
      campaignId,
      allowedAnswers,
      isTopLevel
    })
  }

  // Allow interpolation of scripts with <<answer>>
  const grandChildAnswers = [
    allowedAnswer('CA'),
    allowedAnswer('DE')
  ]

  const grandChildSurvey = newStep('What state for phonebanking?', grandChildAnswers, 'Ok, great, what state?', false)
  const childAnswers = [
    allowedAnswer('Yes', grandChildSurvey._id),
    allowedAnswer('No')
  ]

  const childSurvey = newStep('Can the supporter help phonebank?', childAnswers, 'No problem, can you phone bank instead?', false)

  const parentAnswers = [
    allowedAnswer('Yes'),
    allowedAnswer('No', childSurvey._id)
  ]

  return newStep('Can the supporter attend this event?', parentAnswers, 'Can you attend this event?', true)
}

const createCampaign = (data) => {
  const { organizationId, dueBy } = data
  const customFields = ['eventUrl']
  const campaign = Factory.create('campaign', {
    organizationId,
    dueBy,
    customFields,
  })
  createStep(campaign._id)
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


export const refreshTestData = () => {
  // TODO this should be a separate settings file
  if (Meteor.settings.public.isProduction)
    throw new Error('Cannot refresh test data on production')

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