import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { CampaignContacts } from './campaign_contacts.js';

export const sendMessage = new ValidatedMethod({
  name: 'campaignContacts.sendMessage',
  validate: new SimpleSchema({
    campaignContactId: {type: String},
    text: { type: String },
    isFromContact: {type: Boolean}
  }).validator(),
  run({ campaignContactId, isFromContact, text }) {
    const campaignContact = CampaignContacts.findOne(campaignContactId);

    const message = {
      isFromContact,
      text,
      createdAt: new Date()
    }

    newMessages = campaignContact.messages
    newMessages.push(message)

    CampaignContacts.update(campaignContactId, { $set: {
      messages: newMessages
    } });

  },
});


// TODO:Is this necessary?
// // Get list of all method names on Todos
// const CAMPAIGN_CONTACTS_METHODS = _.pluck([
//   sendMessage,
// ], 'name');

// if (Meteor.isServer) {
//   // Only allow 5 todos operations per connection per second
//   DDPRateLimiter.addRule({
//     name(name) {
//       return _.contains(CAMPAIGN_CONTACTS_METHODS, name);
//     },

//     // Rate limit per connection ID
//     connectionId() { return true; },
//   }, 5, 1000);
// }
