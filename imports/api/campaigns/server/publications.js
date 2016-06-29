import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../campaigns.js'
import { Messages } from '../../messages/messages.js'
import { OptOuts } from '../../opt_outs/opt_outs'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts.js'
import { Assignments, activeAssignmentQuery } from '../../assignments/assignments.js'
import { SurveyQuestions } from '../../survey_questions/survey_questions.js'
import { SurveyAnswers } from '../../survey_answers/survey_answers.js'
import { Roles } from 'meteor/alanning:roles'
// Standardize this
const adminCheck = (userId, organizationId) => (!!userId && Roles.userIsInRole(userId, 'admin', organizationId))

Meteor.publishComposite('campaigns', function (organizationId) {

  if (!adminCheck(this.userId, organizationId)) {
    return
  }

  return {
    find: () => Campaigns.find({ organizationId }),
    children: [
      {
        find: (campaign) => Assignments.find(activeAssignmentQuery(campaign), { limit: 1 })
      }
    ]
  }
})

Meteor.publish('campaign.new', (organizationId) => [
  Roles.getUsersInRole('texter', organizationId),
  OptOuts.find({ organizationId }, { fields: {cell: 1}})
])

Meteor.publishComposite('campaign.edit', (campaignId, organizationId) => {
  return [
    {
      find: () => Campaigns.find({ _id: campaignId }),
      children: [
        {
          find: (campaign) => Messages.find( { campaignId }, { limit: 1})
        },
        {
          find: (campaign) => Assignments.find({ campaignId })
        },
        {
          find: (campaign) => SurveyQuestions.find( { campaignId })
        }
      ]
    },
    {
      find: () => Roles.getUsersInRole('texter', organizationId)
    }
  ]
})

Meteor.publish('campaign', function(campaignId) {
  const campaign = Campaigns.findOne(campaignId)
  const organizationId = campaign.organizationId
  if (!adminCheck(this.userId, organizationId)) {
    return this.ready()
  }

  return [
    Roles.getUsersInRole('texter', organizationId),
    Campaigns.find({ _id: campaignId }),
    Assignments.find({ campaignId }),
    Messages.find()
  ]
})

const computeSurveyStats = (campaignId) => {
  const aggregation = SurveyAnswers.aggregate([
  {
    $match: {
      campaignId
    },
  },
  {
    $group: {
      _id : {surveyQuestionId: '$surveyQuestionId', value: '$value'},
      count: { $sum: 1 },
    },
  },
  ])

  const getAnswerCount = (surveyQuestionId, value) => {
    const stat = aggregation.find((x) => x._id.surveyQuestionId === surveyQuestionId && x._id.value === value)
    return stat ? stat.count : 0
  }
  const surveys = SurveyQuestions.find({ campaignId }, { fields: {text: 1, allowedAnswers: 1}}).fetch()

  const surveyStats = surveys.map((survey) => {
    const responses = survey.allowedAnswers.map((answer) => {
        return {
          answer: answer.value,
          count: getAnswerCount(survey._id, answer.value)
        }
      })

    // TODO - not efficient
    const responseCount = _.reduce(responses.map(({count}) => count ), (memo, num) => memo + num)
    return {
      _id: survey._id,
      text: survey.text,
      responses,
      responseCount
    }
  })

  return surveyStats
}

// server: publish the current size of a collection
Meteor.publish("campaign.stats", function(campaignId) {
  console.log("publishing?")
  let contactCount = 0
  let messageSentCount = 0
  let messageReceivedCount = 0
  let surveyAnswerCount = 0
  let initializing = true

  const contactCountHandle = CampaignContacts.find({ campaignId }).observeChanges({
    added: () => {
      contactCount++
      if (!initializing) {
        this.changed('campaignStats', campaignId, { contactCount })
      }
    },
    removed: () => {
      contactCount--
      this.changed('campaignStats', campaignId, { contactCount })
    }
  })

  const messageSentCountHandle = Messages.find({ campaignId, isFromContact: false }).observeChanges({
    added: () => {
      messageSentCount++
      if (!initializing) {
        this.changed('campaignStats', campaignId, { messageSentCount })
      }
    },
    removed: () => {
      messageSentCount--
      this.changed('campaignStats', campaignId, { messageSentCount })
    }
  })

  const messageReceivedCountHandle = Messages.find({ campaignId, isFromContact: true }).observeChanges({
    added: () => {
      messageReceivedCount++
      if (!initializing) {
        this.changed('campaignStats', campaignId, { messageReceivedCount })
      }
    },
    removed: () => {
      messageReceivedCount--
      this.changed('campaignStats', campaignId, { messageReceivedCount })
    }
  })

  const surveyHandle = SurveyAnswers.find({ campaignId }).observeChanges({
    added: () => {
      surveyAnswerCount++
      if (!initializing) {
        this.changed('campaignStats', campaignId, { surveyAnswerCount })
      }
    },
    removed: () => {
      surveyAnswerCount--
      this.changed('campaignStats', campaignId, { surveyAnswerCount })
    }
  })

  const surveyStats = computeSurveyStats(campaignId)
  initializing = false

  // Not reactives
  this.added('campaignStats', campaignId, { contactCount, messageSentCount, messageReceivedCount, surveyAnswerCount, surveyStats })
  this.ready()

  this.onStop(() => {
    contactCountHandle.stop()
    messageSentCountHandle.stop()
    messageReceivedCountHandle.stop()
    surveyHandle.stop()
  })
})