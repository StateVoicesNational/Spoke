import { Mongo } from 'meteor/mongo'
import { Factory } from 'meteor/dburles:factory'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { ContactFilters } from '../campaign_contacts/methods'
import { Campaigns } from '../campaigns/campaigns'
import { OptOuts } from '../opt_outs/opt_outs'
export const Assignments = new Mongo.Collection('assignments')

// Deny all client-side updates since we will be using methods to manage this collection
Assignments.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

Assignments.schema = new SimpleSchema({
  userId: { type: String },
  campaignId: { type: String },
  createdAt: { type: Date },
  dueBy: { type: Date }
})

Assignments.attachSchema(Assignments.schema)

Factory.define('assignment', Assignments, {
  userId: 'abcd', // fixme
  campaignId: () => Factory.get('campaign'),
  createdAt: () => new Date(),
  dueBy: () => new Date()
})

// This represents the keys from Assignments objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Assignments.publicFields = {
}

export const contactsForAssignmentCursor = (assignmentId, contactFilter) => {
  let query = {}
  if (contactFilter === ContactFilters.UNMESSAGED) {
    query = { lastMessage: null }
  } else if (contactFilter === ContactFilters.UNREPLIED) {
    query = { 'lastMessage.isFromContact': true }
  }
  return CampaignContacts.find(_.extend(query, { assignmentId }))
}

Assignments.helpers({
  contacts(contactFilter) {
    return contactsForAssignmentCursor(this._id, contactFilter)
  },
  campaign() {
    return Campaigns.findOne({ _id: this.campaignId })
  }
})
