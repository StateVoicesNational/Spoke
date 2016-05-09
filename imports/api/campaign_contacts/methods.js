import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { CampaignContacts } from './campaign_contacts.js'
import {Plivo} from 'meteor/pfafman:plivo'

// TODO We don't actually want to loop this -- we want to bulk insert
export const insertContact = new ValidatedMethod({
  name: 'campaignContacts.insert',
  validate: new SimpleSchema({
    campaignId: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    cell: { type: String },
    customFields: { type: Object, blackbox: true }
  }).validator(),
  run(contact) {
    contact.createdAt = new Date()
    CampaignContacts.insert(contact)
  }
})

export const sendMessage = new ValidatedMethod({
  name: 'campaignContacts.sendMessage',
  validate: new SimpleSchema({
    campaignContactId: { type: String },
    text: { type: String },
    isFromContact: { type: Boolean }
  }).validator(),
  run({ campaignContactId, isFromContact, text }) {
    const campaignContact = CampaignContacts.findOne(campaignContactId)

    if (Meteor.isServer)
    {
      plivo = Plivo.RestAPI({
        authId: Meteor.settings.private.plivo.authId,
        authToken: Meteor.settings.private.plivo.authToken,
      });

      const params = {
          src: Meteor.settings.plivo.fromPhoneNumber, // Caller Id
          dst : Meteor.settings.plivo.testPhoneNumbers.sheena, // User Number to Call
          text : text,
          type : "sms",
      };

      plivo.send_message(params, function (status, response) {
        if (status === 202)
        {
          const plivoMessageId = response['message_uuid'][0]
          const message = {
            isFromContact,
            text,
            plivoMessageId,
            createdAt: new Date()
          }

          const messages = campaignContact.messages
          messages.push(message)
          // TODO This hsould not be in server block bc optimistic UI should be working but not sure how

          CampaignContacts.update(campaignContactId, { $set: {
            messages,
            lastMessage: message
          } })
        }
        else {
          console.log("error")
          console.log(status, response);
        }
      });
    }

  }
})

export const updateSurveyResponse = new ValidatedMethod({
  name: 'campaignContacts.updateSurveyResponse',
  validate: new SimpleSchema({
    campaignContactId: { type: String },
    campaignSurveyId: { type: String },
  }).validator(),
  run({ campaignContactId, campaignSurveyId }) {
    const campaignContact = CampaignContacts.findOne(campaignContactId)

    CampaignContacts.update(campaignContactId, { $set: {
      campaignSurveyId
    } })
  }
})

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
