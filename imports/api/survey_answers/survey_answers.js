import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const SurveyAnswers = new Mongo.Collection('survey_answers')

SurveyAnswers.schema = new SimpleSchema({
  campaignContactId: { type: String },
  surveyQuestionId: { type: String },
  value: { type: String }
})
