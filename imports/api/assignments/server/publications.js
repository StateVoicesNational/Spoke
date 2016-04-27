import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Assignments } from '../assignments.js'
import { Campaigns } from '../../campaigns/campaigns'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts'
import { SurveyQuestions } from '../../survey_questions/survey_questions'
import { SurveyAnswers } from '../../survey_answers/survey_answers'
import { Messages } from '../../messages/messages'

Meteor.publish('assignments', () =>
  // TODO: actually filter correctly and return public fields only
  Assignments.find({})
)

Meteor.publishComposite('assignment.allRelatedData', (assignmentId) => {
  new SimpleSchema({
    assignmentId: { type: String }
  }).validate({ assignmentId })

// TODO I actually don't think we need reactivity here.
  return {
    find: () => Assignments.find({ _id: assignmentId }),
    children: [
      {
        find: (assignment) => Campaigns.find({ _id: assignment.campaignId }),
        children: [
          {
            find: (campaign) => {
              SurveyQuestions.find({ _id: campaign.surveyQuestionId })
              const ids = [];

               // recursive search for child articles - populates
               // the ids array
               // This is not reactive.
               const search = function(questionId) {
                console.log("searching questionid", questionId)

                  if (questionId === null)
                  {
                    return
                  }

                 ids.push(questionId);
                 const surveyQuestion = SurveyQuestions.findOne({_id : questionId })
                 const childIds = surveyQuestion.allowedAnswers.map(({surveyQuestionId}) => surveyQuestionId).filter((val) => val)

                 console.log("childIds", childIds)
                 for (let childId of childIds) {
                  console.log("child is ", childId)
                    search(childId);
                  }
               }


               // populate ids, starting with articleId
               search(campaign.surveyQuestionId);

               console.log("FETCHING IDS", ids)

               return SurveyQuestions.find({_id: {$in: ids}})
            }
          },
          {
            // TODO sort by created
            find: (campaign) => Messages.find({ campaignId: campaign._id })
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

