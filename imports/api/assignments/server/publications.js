import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Assignments } from '../assignments.js'
import { Campaigns } from '../../campaigns/campaigns'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts'
import { SurveyQuestions } from '../../survey_questions/survey_questions'
import { SurveyAnswers } from '../../survey_answers/survey_answers'
import { Messages } from '../../messages/messages'
import { OptOuts } from '../../opt_outs/opt_outs'

// TODO: actually filter correctly and return public fields only


Meteor.publishComposite('assignments', {
  find: function() {
    console.log('this.userId', this.userId)
    return Assignments.find({
    userId: this.userId
  })},
  children: [
    {
      find: (assignment) => Campaigns.find({ _id : assignment.campaignId })
    }
  ]
})

Meteor.publishComposite('assignment.allRelatedData', (assignmentId) => {
  // new SimpleSchema({
  //   assignmentId: { type: String }
  // }).validate({ assignmentId })
  const userId = this.userId
  console.log("this userID")
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
              // This is not reactive.
              const ids = []
              const search = (questionId) => {
                if (!questionId) {
                  return
                }

                ids.push(questionId)
                const surveyQuestion = SurveyQuestions.findOne({ _id: questionId })
                const childIds = surveyQuestion.allowedAnswers.map(({ surveyQuestionId }) => surveyQuestionId).filter((val) => val)

                for (let childId of childIds) {
                  search(childId)
                }
              }
              search(campaign.surveyQuestionId)
              return SurveyQuestions.find({ _id: { $in: ids } })
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

