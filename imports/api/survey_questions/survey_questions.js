import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'
export const SurveyQuestions = new Mongo.Collection('survey_questions')

const AllowedAnswerSchema = new SimpleSchema({
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

const createAnswer = (value) => ({
  value,
  script: Fake.fromArray([
    "Hi there, <<name>>! We have an event coming up soon and we're hoping you can join us to help Bernie win! If you can, let us know!",
    'Hey <<name>>! Come help us out at this upcoming event.',
    "Hi <<name>>. We'd love to have you join us at an upcoming rally in your area. Do you think you'll be free?"
  ]),
  surveyQuestionId: null
})

Factory.define('survey_question', SurveyQuestions, {
  question: () => Fake.fromArray([
    'Can the user attend the event?',
    'Will this person support Bernie?'
  ]),
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
