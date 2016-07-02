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
  question: { type: String },
  script: { type: String },
  allowedAnswers: { type: [AllowedAnswerSchema] },
  instructions: { // any instructions for the texter at this step
    type: String,
    optional: true
  },
  isTopLevel: { type: Boolean }
})

InteractionSteps.attachSchema(InteractionSteps.schema)

Factory.define('interaction_steps', InteractionSteps, {
  campaignId: () => 'abcd',
  text: () => Fake.fromArray([
    'Yes',
    'No',
    'Maybe'
  ]),
  question: () => Fake.fromArray([
    'Can the user attend the event?',
    'Will this person support Bernie?'
  ]),
  script: () => 'Test script',
  allowedAnswers: () => ['Yes', 'No', 'Maybe'].map((answer) => newAllowedAnswer(answer)),
  instructions: () => Fake.sentence(20),
  isTopLevel:() => true
})
