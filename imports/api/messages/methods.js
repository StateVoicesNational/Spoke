import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Messages } from './messages.js'
import { Plivo } from 'meteor/pfafman:plivo'
import { Meteor } from 'meteor/meteor'

export const sendMessage = new ValidatedMethod({
  name: 'messages.send',
  validate: new SimpleSchema({
    contactNumber: { type: String },
    userNumber: { type: String },
    text: { type: String },
    isFromContact: { type: Boolean },
    campaignId: { type: String }
  }).validator(),
  run({ text, userNumber, contactNumber, isFromContact, campaignId }) {
    if (Meteor.isServer)
    {
      const message = {
        userNumber,
        contactNumber,
        isFromContact,
        text,
        campaignId,
        serviceMessageId: 'plivoId',
        createdAt: new Date()
      }

      Messages.insert(message)


      // const plivo = Plivo.RestAPI({
      //   authId: Meteor.settings.private.plivo.authId,
      //   authToken: Meteor.settings.private.plivo.authToken,
      // });
      // console.log(Meteor.settings)

      // const userNumber = Meteor.settings.private.plivo.fromPhoneNumber
      // const contactNumber = Meteor.settings.private.plivo.testPhoneNumbers.sheena

      // const params = {
      //     src: userNumber, // Caller Id
      //     dst: contactNumber,
      //     text: text,
      //     type: 'sms'
      // };

      // plivo.send_message(params, function (status, response) {
      //   if (status === 202)
      //   {
      //     const message = {
      //       userNumber,
      //       contactNumber,
      //       isFromContact,
      //       text,
      //       campaignId,
      //       serviceMessageId: response['message_uuid'][0],
      //       createdAt: new Date()
      //     }

      //     Messages.insert(message)
      //   }
      //   else {
      //     console.log(status, response);
      //   }
      // });
    }

  }
})
