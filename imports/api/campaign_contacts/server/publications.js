import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { CampaignContacts } from '../campaign_contacts.js';

Meteor.publish('campaignContacts.forAssignment', function (assignmentId) {
  console.log("assignmentId", assignmentId)
  new SimpleSchema({
    assignmentId: {type: String}
  }).validate({ assignmentId });

  return CampaignContacts.find({assignmentId: assignmentId});
});