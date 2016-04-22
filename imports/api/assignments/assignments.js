import { Mongo } from 'meteor/mongo'
import { Factory } from 'meteor/dburles:factory'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { Factory } from 'meteor/dburles:factory'

export const Assignments = new Mongo.Collection('assignments')

// Deny all client-side updates since we will be using methods to manage this collection
Assignments.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

Assignments.schema = new SimpleSchema({
  // userId: {type:String},
  campaignId: { type: String },
  createdAt: { type: Date },
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
})

Assignments.attachSchema(Assignments.schema)

Factory.define('assignment', Assignments, {
  // userId: Factory.get('user'),
  campaignId: () => Factory.get('campaign'),
  createdAt: () => new Date(),
  // TODO: Campaign cached here isn't the same as campaignId created above
})

// This represents the keys from Assignments objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Assignments.publicFields = {
}

Assignments.helpers({
  contacts() {
    return CampaignContacts.find({ assignmentId: this._id })
  }
})
