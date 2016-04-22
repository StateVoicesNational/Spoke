import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'

export const CampaignSurveys = new Mongo.Collection('campaign_surveys')

// TODO: The issue with this is it's not immediately obvious from looking at a document what its children are (e.g. its possible answers)

CampaignSurveys.schema = new SimpleSchema({
  answer: { // the current response recorded -- this will be null for the top level survey unless the qusetion
    type: String,
    optional: true
  },
  script: { type: String },
  question: {
    type: String,
    optional: true
  },
  answerChildren: { // array of nested CampaignSurveys
    type: [String],
    optional: true
  },
  instructions: {
    type: String,
    optional: true
  }, // any instructions for the texter at this step
})

Factory.define('campaign_survey', CampaignSurveys, {
  answer: () => Fake.fromArray['Yes', 'No', 'Maybe'],
  script: () => Fake.fromArray([
    "Hi there, <<name>>! We have an event coming up soon and we're hoping you can join us to help Bernie win! If you can, let us know!",
    'Hey <<name>>! Come help us out at this upcoming event.',
    "Hi <<name>>. We'd love to have you join us at an upcoming rally in your area. Do you think you'll be free?"
  ]),
  question: () => Fake.fromArray(['Can the user attend the event?', 'Will this person support Bernie?']),
  answerChildren: () => [Factory.get('campaign_survey')],
  instructions: () => Fake.sentence(20)
})