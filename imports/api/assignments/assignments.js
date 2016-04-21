import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Fake } from 'meteor/anti:fake';
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js';

export const Assignments = new Mongo.Collection('assignments');

// Deny all client-side updates since we will be using methods to manage this collection
Assignments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Assignments.schema = new SimpleSchema({
  // userId: {type:String},
  campaignId: { type: String },
  createdAt: { type: Date   },
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  campaign: {type: Object, },
  'campaign.title': {type: String},
  'campaign.description': {type: String},
  'campaign.script': {type: String},
  'campaign.custom_fields': {type: [String]},
});

Assignments.attachSchema(Assignments.schema);

Factory.define('assignment', Assignments, {
  // userId: Factory.get('user'),
  campaignId: () => Factory.get('campaign'),
  createdAt: () => new Date(),
  // TODO: Campaign cached here isn't the same as campaignId created above
  campaign: function() {
    console.log(Factory.tree('campaign'))
    let campaignData = Factory.tree('campaign')
    delete campaignData['createdAt']

    return campaignData
  }
});

// This represents the keys from Assignments objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Assignments.publicFields = {
};

Assignments.helpers({
  contacts() {
    return CampaignContacts.find({assignmentId: this._id})
  }
});
