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
  }
})

SurveyQuestions.schema = new SimpleSchema({
  campaignId: { type: String },
  question: { type: String },
  allowedAnswers: { type: [AllowedAnswerSchema] },
  instructions: { // any instructions for the texter at this step
    type: String,
    optional: true
  }
})

SurveyQuestions.attachSchema(SurveyQuestions.schema)

export const newAllowedAnswer = (value) => ({
  value,
  _id: Random.id(),
})

Factory.define('survey_question', SurveyQuestions, {
  question: () => Fake.fromArray([
    'Can the user attend the event?',
    'Will this person support Bernie?'
  ]),
  campaignId: () => 'abcd',
  allowedAnswers: () => ['Yes', 'No', 'Maybe'].map((answer) => createAnswer(answer)),
  instructions: () => Fake.sentence(20)
})

SurveyQuestions.helpers({
  children() {
    const childIds = this.allowedAnswers.map(({ surveyQuestionId }) => surveyQuestionId).filter((val) => val)
    console.log("childIds", childIds)
    return SurveyQuestions.find({ _id: {$in: childIds}})
  }
})
