import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { SurveyAnswers } from './survey_answers.js'

export const updateAnswers = new ValidatedMethod({
  name: 'answers.update',
  validate: new SimpleSchema({
    campaignContactId: { type: String },
    campaignId: { type: String },
    answers: { type: Object, blackbox: true } // TODO: validate based on  key value id
  }).validator(),
  run({ campaignContactId, campaignId, answers }) {

    const interactionStepIds = _.keys(answers)

    SurveyAnswers.remove({
      campaignContactId,
      campaignId,
      interactionStepId: { $nin: interactionStepIds }
    })
    _.each(answers, (interactionStepId, value) => {
      const answer = SurveyAnswers.findOne({ campaignContactId, interactionStepId })
      if (answer) {
        SurveyAnswers.update(
          { _id: answer._id },
          { $set: { value } })
      } else {
        SurveyAnswers.insert({
          campaignContactId,
          interactionStepId,
          campaignId,
          value
        })
      }
    })

  }
})
