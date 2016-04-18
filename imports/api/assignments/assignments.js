import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Assignments = new Mongo.Collection('Assignments');

// Deny all client-side updates since we will be using methods to manage this collection
Assignments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Assignments.schema = new SimpleSchema({
  campaignId: { type: String },
  userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  // TODO: I think normalization is ok here bc this should not change so DPP won't update stuff
  campaignContactIds: {type: [Object]}
});

Assignments.attachSchema(Assignments.schema);

// This represents the keys from Assignments objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Assignments.publicFields = {
  campaignId: 1,
  incompleteCount: 1,
  userId: 1,
};

Assignments.helpers({
  // campaign() {
  //   return Campaigns.findOne({_id: this.campaignId})
  // }
});
