import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'
import { SurveyQuestions } from '../survey_questions/survey_questions'
import { InteractionSteps } from '../interaction_steps/interaction_steps'
import { Messages } from '../messages/messages'
import { Assignments, activeAssignmentQuery } from '../assignments/assignments'
import { moment } from 'meteor/momentjs:moment'
import { ScriptSchema, ScriptTypes, allScriptFields } from './scripts'

export const Campaigns = new Mongo.Collection('campaigns')

// TODO necessary?
// Deny all client-side updates since we will be using methods to manage this collection
Campaigns.deny({
  insert() { return true },
})

Campaigns.schema = new SimpleSchema({
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  // TODO: I think normalization is ok here bc this should not change so won't update stuff
  organizationId: { type: String },
  title: { type: String },
  description: { type: String },
  createdAt: { type: Date },
  dueBy: { type: Date },
  customFields: { type: [String] },
  // FIXME: interactionsteps
  surveyQuestionId: {
    type: String,
    optional: true
  },
  scripts: { type: [ScriptSchema]}
})

Campaigns.attachSchema(Campaigns.schema)

Factory.define('campaign', Campaigns, {
  createdAt: () => new Date(),
  // dueBy: () => moment().add(5, 'days').toDate(),
  title: () => Fake.fromArray([
    'Baltimore Phonebank Recruitment',
    'Young Voters Rally',
    'NY GOTV',
    'CA Phonebanking']),
  description: () => Fake.fromArray([
    'Invite users to canvassing',
    'Sign up volunteers',
    'Get out the vote!']),
  customFields: [],
  dueBy: () => new Date(),
  surveyQuestionId: Factory.get('survey_question'),
  assignedTexters: [],
  scripts: () => [
    {
      title: "I don't have a laptop",
      text: 'No problem, {firstName}. You can usually use a tablet. Just be sure to check beforehand!',
      type: ScriptTypes.FAQ
    },
    {
      title: "I can only make it for part of the time.",
      text: "That's okay. You can still come. Just let us know if you can or not.",
      type: ScriptTypes.FAQ
    },
    {
      // TODO: Enforce that there is only one INITIAL
      text: "Hi {firstName}. This is {texterFirstName} here.",
      type: ScriptTypes.INITIAL
    }
  ]
})

// This represents the keys from Campaigns objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Campaigns.publicFields = {
}


Campaigns.helpers({
  hasMessage() {
    return !!Messages.findOne( { campaignId: this._id })
  },
  initialScriptText() {
    console.log("INITIAL SCRIPT TEXT")
    const firstStep = this.firstStep()
    console.log("first step?", firstStep)
    return firstStep ? firstStep.script : null
  },
  faqScripts() {
    return this.scripts.filter((script) => script.type === ScriptTypes.FAQ)
  },
  activeAssignment() {
    return Assignments.findOne(activeAssignmentQuery(this))
  },
  scriptFields() {
    return allScriptFields(this.customFields)
  },
  firstStep() {
    return InteractionSteps.findOne({ isTopLevel: true, campaignId: this._id})
  },
  interactionSteps() {
    return InteractionSteps.find({ campaignId: this._id })
  },
  survey() {
    return SurveyQuestions.findOne({ _id: this.surveyQuestionId })
  },
  messages() {
    return Messages.find({ campaignId: this._id })
  }
})