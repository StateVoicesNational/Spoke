import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Assignments, contactsForAssignmentCursor } from '../assignments.js'
import { Campaigns } from '../../campaigns/campaigns'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts'
import { ContactFilters } from '../../campaign_contacts/methods'
import { SurveyQuestions } from '../../survey_questions/survey_questions'
import { Scripts } from '../../scripts/scripts'
import { InteractionSteps } from '../../interaction_steps/interaction_steps'
import { SurveyAnswers } from '../../survey_answers/survey_answers'
import { ZipCodes } from '../../zip_codes/zip_codes'
import { Messages } from '../../messages/messages'
import { OptOuts } from '../../opt_outs/opt_outs'
import { todosForUser } from '../../users/users'
import { defaultTimezoneIsBetweenTextingHours, validOffsets } from '../../../../both/timezones'
// TODO: actually filter correctly and return public fields only


// FIXME publishing too much data to the client
Meteor.publishComposite('assignments', {
  find: function() {
    return Assignments.find({
    userId: this.userId
  })},
  children: [
    {
      find: (assignment) => Campaigns.find({ _id : assignment.campaignId })
    }
  ]
})

Meteor.publish('assignments.todo', function(organizationId) {
  const userId = this.userId
  const assignments = Assignments.find({ userId }, { sort: {dueBy: 1}}).fetch()
  const assignmentIds = assignments.map((assignment) => assignment._id)
  // Contacts - lastMessage
  const optOuts = OptOuts.find( { organizationId }, { fields: { cell: 1 }})

  const validZips = ZipCodes.find({ timezoneOffset: {$in: validOffsets() } }, { fields: { zip: 1 } }).fetch().map(({zip}) => zip)

  if (defaultTimezoneIsBetweenTextingHours()) {
    validZips.push(null)
  }

  const baseQuery = {
    assignmentId: { $in: assignmentIds },
    cell: { $nin: optOuts.map((optOut) => optOut.cell)}
  }

  const badTimezoneAggregation = CampaignContacts.aggregate([
  {
    $match: _.extend({}, baseQuery, { zip: { $nin: validZips }})
  },
  {
    $group: {
      _id : '$assignmentId',
      count: { $sum: 1 }
    },
  },
  ])

  console.log(badTimezoneAggregation)
  const aggregation = CampaignContacts.aggregate([
  {
    $match: _.extend({}, baseQuery, { zip: { $in: validZips } })
  },
  {
    $group: {
      _id : {isFromContact: '$lastMessage.isFromContact', assignmentId: '$assignmentId'},
      count: { $sum: 1 }
    },
  },
  ])

  const results = _.map(assignments, (assignment) => {
    const result = {
      assignment,
      unmessagedCount: 0,
      unrepliedCount: 0,
      badTimezoneCount: 0
    }

    _.each(badTimezoneAggregation.filter((row) => row._id === assignment._id), (row) => {
        result.badTimezoneCount = row.count
    })

    _.each(aggregation.filter((row) => row._id.assignmentId === assignment._id), (row) => {
      if (row._id.isFromContact === true) { // Last message is from the contact
        result.unrepliedCount = row.count
        console.log("unrepliedCount", row.count)
      } else if (row._id.isFromContact === undefined) { // No last message found
        result.unmessagedCount = row.count
        console.log("unmessagedCount", row.count)
      } else {
        console.log("i found some messaged counts")
      }
    })

    return result
  })


  this.added('todos', organizationId, { results })
  this.ready()
})

// FIXME: between this and assignment.todo we are loading the
// Assignments twice
Meteor.publishComposite('assignments.todo.additional', function(organizationId) {
  // new SimpleSchema({
  //   assignmentId: { type: String }
  // }).validate({ assignmentId })
  const userId = this.userId
  console.log("publishcomposite assignments.todo.additional", userId)
  // TODO I actually don't think we need reactivity here.
  return {
    find: () => Assignments.find({ userId }),
    children: [
      {
        find: (assignment) => {
          return Campaigns.find({ _id: assignment.campaignId })
        }
      }
    ]
  }
})


Meteor.publish('assignment.text', function(assignmentId, contactFilter, organizationId) {
  const contacts = contactsForAssignmentCursor(assignmentId, contactFilter, organizationId).fetch()
  const userId = this.userId
  const contactNumbers = contacts.map((contact) => contact.cell)
  const zipCodes = contacts.map((contact) => contact.zip)
  const assignment = Assignments.findOne(assignmentId) // TODO redundant loading
  const campaignId = assignment.campaignId
  console.log("contactNumbers", contactNumbers, "userID", this.userId)
  console.log('mess', Messages.find({ contactNumber: { $in: contactNumbers }}).fetch())
  console.log("messages", Messages.find( { contactNumber: {$in: contactNumbers}, userId }).fetch())


    // TODO: Maybe optouts should be reactive, but nothing else really needs to be.
  return [
    Assignments.find({ _id: assignmentId }),
    Campaigns.find({ _id: campaignId}),
    Messages.find( { contactNumber: {$in: contactNumbers}, userId }),
    OptOuts.find({ organizationId }),
    Scripts.find( { campaignId, $or: [{ userId: null }, { userId: this.userId }]}),
    InteractionSteps.find( { campaignId }),
        // FIXME survey answers
    SurveyAnswers.find( { campaignId }),
    ZipCodes.find({ zip: { $in: zipCodes }}),
    CampaignContacts.find({_id: {$in: contacts.map((contact) => contact._id)}}),
  ]
})

Meteor.publishComposite('assignment.allRelatedData', (assignmentId) => {
  // new SimpleSchema({
  //   assignmentId: { type: String }
  // }).validate({ assignmentId })
  const userId = this.userId
  // TODO I actually don't think we need reactivity here.
  return {
    find: () => Assignments.find({
      _id: assignmentId
    }),
    children: [
      {
        find: (assignment) => Campaigns.find({ _id: assignment.campaignId }),
        children: [
          {
            find: (campaign) => {
              return InteractionSteps.find({ campaignId: campaign._id})

              // This is not reactive.
              // const ids = []
              // const search = (questionId) => {
              //   if (!questionId) {
              //     return
              //   }

              //   ids.push(questionId)
              //   const surveyQuestion = SurveyQuestions.findOne({ _id: questionId })
              //   const childIds = surveyQuestion.allowedAnswers.map(({ surveyQuestionId }) => surveyQuestionId).filter((val) => val)

              //   for (let childId of childIds) {
              //     search(childId)
              //   }
              // }
              // search(campaign.surveyQuestionId)
              // return SurveyQuestions.find({ _id: { $in: ids } })
            }
          },
          {
            // TODO sort by created
            find: (campaign) => Messages.find({ campaignId: campaign._id })
          },
          {
            find: (campaign) => OptOuts.find({ organizationId: campaign.organizationId})
          }
        ]
      },
      {
        find: (assignment) => CampaignContacts.find({ assignmentId: assignment._id }),
        children: [
          {
            find: (contact) => SurveyAnswers.find({ campaignContactId: contact._id })
          }
        ]
      }

    ]
  }
})

