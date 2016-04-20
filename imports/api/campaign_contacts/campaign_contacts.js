import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import {Fake} from 'meteor/anti:fake';

export const CampaignContacts = new Mongo.Collection('campaign_contacts');

// Deny all client-side updates since we will be using methods to manage this collection
CampaignContacts.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

CampaignContacts.schema = new SimpleSchema({
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  campaignId: {type: String},
  contactId: {type: String}, // This would be used to send data back to whatever your source of contacts is --
  // You could then remove users if opting them out or mark phone numbers as untextable, etc. This is taken from the source data itself,
  // not an ID in our own system
  name: {type: String},
  number: {type: String},
  custom_fields: {type: Object},
  createdAt: {type: Date},
  assignmentId: {type: String} // so we can tell easily what is unassigned
});

CampaignContacts.attachSchema(CampaignContacts.schema);

Factory.define('campaign_contact', CampaignContacts, {
  campaignId: () => Factory.get('campaign'),
  contactId: Fake.word,
  name:   Fake.user({fields: ['name']}).name,
  number: '669-221-6251',
  custom_fields: function() {
    fields = {}
    fields[Fake.word] = Fake.sentence(2)
    return fields
  },
  createdAt: () => new Date(),
  assignmentId: () => Factory.get('assignment')
});

// This represents the keys from CampaignContacts objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
CampaignContacts.publicFields = {
};

CampaignContacts.helpers({
});
