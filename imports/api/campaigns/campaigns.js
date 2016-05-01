import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'
import { SurveyQuestions } from '../survey_questions/survey_questions'
import { Messages } from '../messages/messages'

export const Campaigns = new Mongo.Collection('campaigns')

// Deny all client-side updates since we will be using methods to manage this collection
Campaigns.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

const FAQSchema = new SimpleSchema({
  title: { type: String },
  script: { type: String }
})

Campaigns.schema = new SimpleSchema({
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  // TODO: I think normalization is ok here bc this should not change so DPP won't update stuff
  title: { type: String },
  description: { type: String },
  createdAt: { type: Date },
  customFields: { type: [String] },
  surveyQuestionId: {
    type: String,
    optional: true
  },
  script: { type: String }, // TODO Should scripts be in a separate collection? Currently they are strewn about
  faqScripts: { type: [FAQSchema]}
})

Campaigns.attachSchema(Campaigns.schema)

Factory.define('campaign', Campaigns, {
  createdAt: () => new Date(),
  title: () => Fake.fromArray([
    'Baltimore Phonebank Recruitment',
    'Bernie Journey',
    'NY GOTV',
    'CA Phonebanking']),
  description: () => Fake.fromArray([
    'Invite users to canvassing',
    'Sign up volunteers',
    'Get out the vote!']),
  customFields: [],
  surveyQuestionId: Factory.get('survey_question'),
  script: () => 'Hey there <<name>>',
  faqScripts: () => [
    {
      title: "I don't have a laptop",
      script: 'No problem, <<name>>. You can usually use a tablet. Just be sure to check beforehand!'
    },
    {
      title: "I can only make it for part of the time.",
      script: "That's okay. You can still come. Just let us know if you can or not."
    }
  ]
})

// This represents the keys from Campaigns objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Campaigns.publicFields = {
}

Campaigns.helpers({
  survey() {
    return SurveyQuestions.findOne({ _id: this.surveyQuestionId })
  },
  messages() {
    return Messages.find({ campaignId: this._id })
  }
})
