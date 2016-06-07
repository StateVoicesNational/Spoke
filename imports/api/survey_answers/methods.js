import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { SurveyAnswers } from './survey_answers.js'

export const updateAnswer = new ValidatedMethod({
  name: 'answer.update',
  validate: new SimpleSchema({
    campaignContactId: { type: String },
    surveyQuestionId: { type: String },
    campaignId: { type: String },
    value: { type: String } // TODO: validate based on questionsurvey id
  }).validator(),
  run({ campaignContactId, campaignId, surveyQuestionId, value }) {
    const answer = SurveyAnswers.findOne({ campaignContactId, surveyQuestionId })
    if (answer) {
      SurveyAnswers.update(
        { _id: answer._id },
        { $set: { value } })
    } else {
      SurveyAnswers.insert({
        campaignContactId,
        surveyQuestionId,
        campaignId,
        value
      })
    }
  }
})
