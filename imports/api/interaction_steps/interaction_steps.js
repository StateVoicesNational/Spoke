import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'
import { Random } from 'meteor/random'
export const InteractionSteps = new Mongo.Collection('interaction_steps')

export const newAllowedAnswer = (value) => { return {
  value,
  _id: Random.id(),
}}

const AllowedAnswerSchema = new SimpleSchema({
  _id: { type: String },
  value: { type: String },
  script: { // should this be its own ID?
    type: String,
    optional: true
  },
  interactionStepId: {
    type: String,
    optional: true
  },
})


InteractionSteps.schema = new SimpleSchema({
  campaignId: { type: String },
  question: { type: String, optional: true },
  script: { type: String, optional: true },
  allowedAnswers: { type: [AllowedAnswerSchema] },
  isTopLevel: { type: Boolean }
})

InteractionSteps.attachSchema(InteractionSteps.schema)

Factory.define('interaction_step', InteractionSteps, {
  campaignId: () => 'abcd',
  question: () => Fake.fromArray([
    'Can the user attend the event?',
    'Will this person support Bernie?'
  ]),
  script: () => 'Test script',
  allowedAnswers: () => ['Yes', 'No', 'Maybe'].map((answer) => newAllowedAnswer(answer)),
  isTopLevel:() => true
})

InteractionSteps.helpers({
})
