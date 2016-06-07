import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'
import { Random } from 'meteor/random'
export const SurveyQuestions = new Mongo.Collection('survey_questions')

const AllowedAnswerSchema = new SimpleSchema({
  _id: { type: String },
  value: { type: String },
  script: { // should this be its own ID?
    type: String,
    optional: true
  },
  surveyQuestionId: {
    type: String,
    optional: true
  },
})

SurveyQuestions.schema = new SimpleSchema({
  campaignId: { type: String },
  text: { type: String },
  allowedAnswers: { type: [AllowedAnswerSchema] },
  instructions: { // any instructions for the texter at this step
    type: String,
    optional: true
  },
  isTopLevel: { type: Boolean }
})

SurveyQuestions.attachSchema(SurveyQuestions.schema)

export const newAllowedAnswer = (value) => { return {
  value,
  _id: Random.id(),
}}

Factory.define('survey_question', SurveyQuestions, {
  text: () => Fake.fromArray([
    'Can the user attend the event?',
    'Will this person support Bernie?'
  ]),
  campaignId: () => 'abcd',
  allowedAnswers: () => ['Yes', 'No', 'Maybe'].map((answer) => newAllowedAnswer(answer)),
  instructions: () => Fake.sentence(20),
  isTopLevel:() => true
})

SurveyQuestions.helpers({
  children() {
    const childIds = this.allowedAnswers.map(({ surveyQuestionId }) => surveyQuestionId).filter((val) => val)
    return SurveyQuestions.find({ _id: {$in: childIds}})
  }
})
