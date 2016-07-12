import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const SurveyAnswers = new Mongo.Collection('survey_answers')

SurveyAnswers.schema = new SimpleSchema({
  campaignId: { type: String },
  campaignContactId: { type: String },
  interactionStepId: { type: String },
  value: { type: String },
})

SurveyAnswers.attachSchema(SurveyAnswers.schema)
