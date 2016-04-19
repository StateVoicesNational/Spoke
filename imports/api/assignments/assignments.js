import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import {Fake} from 'meteor/anti:fake';

// TODO I'm importing this for the factory definition below, but this is prob not a great idea
import '../campaigns/campaigns.js';

export const Assignments = new Mongo.Collection('assignments');

// Deny all client-side updates since we will be using methods to manage this collection
Assignments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Assignments.schema = new SimpleSchema({
  campaignId: { type: String },
  // TODO: I think normalization is ok here bc this should not change so DPP won't update stuff
  campaignContactIds: {type: [Object]},
  createdAt: {type: Date}
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
});

Assignments.attachSchema(Assignments.schema);

Factory.define('assignment', Assignments, {
  campaignId: () => Factory.get('campaign'),
  createdAt: () => new Date(),
  campaignContactIds: []
});

// This represents the keys from Assignments objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Assignments.publicFields = {
  campaignId: 1,
  userId: 1,
};

Assignments.helpers({
  // campaign() {
  //   return Campaigns.findOne({_id: this.campaignId})
  // }
});
