import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Assignments, contactsForAssignmentCursor } from '../assignments.js'
import { Campaigns } from '../../campaigns/campaigns'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts'
import { ContactFilters } from '../../campaign_contacts/methods'
import { SurveyQuestions } from '../../survey_questions/survey_questions'
import { SurveyAnswers } from '../../survey_answers/survey_answers'
import { Messages } from '../../messages/messages'
import { OptOuts } from '../../opt_outs/opt_outs'
import { todosForUser } from '../../users/users'

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

  const aggregation = CampaignContacts.aggregate([
  {
    $match: {
      assignmentId: {$in: assignmentIds}
    },
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
      unrepliedCount: 0
    }

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
          console.log("find assignment acmapign", assignment.campaignId)
          return Campaigns.find({ _id: assignment.campaignId })
        }
      }
    ]
  }
})


Meteor.publish('assignment.text', function(assignmentId, contactFilter, organizationId) {
  console.log("start assignment.text publication")

  const contacts = contactsForAssignmentCursor(assignmentId, contactFilter).fetch()
  console.log("HERE ARE THE CONTACTS", contacts)
  console.log(contacts)
  const userId = this.userId
  console.log("CONTACTS", contacts)
  const contactNumbers = contacts.map((contact) => contact.cell)
  console.log("i n message asignment.text publication: contactNumber", contactNumbers, "userId", userId)
  const assignment = Assignments.findOne(assignmentId) // TODO redundant loading
  const campaignId = assignment.campaignId
  // TODO: Maybe optouts should be reactive, but nothing else really needs to be.
  return [
    Assignments.find({ _id: assignmentId }),
    Campaigns.find({ _id: campaignId}),
    Messages.find( { contactNumber: {$in: contactNumbers}, userId }),
    OptOuts.find({ organizationId: organizationId}),
    SurveyQuestions.find( { campaignId }),
    SurveyAnswers.find( { campaignId }),
    // FIXME survey answers
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
              return SurveyQuestions.find({ campaignId: campaign._id})

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

