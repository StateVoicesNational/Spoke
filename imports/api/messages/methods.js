import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Messages } from './messages.js'
import { Plivo } from 'meteor/pfafman:plivo'
import { Meteor } from 'meteor/meteor'

export const insertMessage = new ValidatedMethod({
  name: 'messages.insert',
  validate: new SimpleSchema({
    contactNumber: { type: String },
    userNumber: { type: String },
    text: { type: String },
    isFromContact: { type: Boolean },
    campaignId: { type: String },
    serviceMessageId: { type: String }
  }).validator(),
  run({ text, userNumber, contactNumber, isFromContact, campaignId, serviceMessageId }) {
    const message = {
      userNumber,
      contactNumber,
      isFromContact,
      text,
      campaignId,
      serviceMessageId,
      createdAt: new Date()
    }

    Messages.insert(message)
  }
})

const remoteCreateMessage = (text, userNumber, contactNumber, onSuccess, onError) => {
  if (!Meteor.settings.public.isProduction && !Meteor.settings.public.textingEnabled) {
    console.log("Faking message sending")
    onSuccess('fake_message_id')
  } else {
    const plivo = Plivo.RestAPI({
      authId: Meteor.settings.private.plivo.authId,
      authToken: Meteor.settings.private.plivo.authToken
    })

    const params = {
      text,
      src: userNumber, // Caller Id
      dst: contactNumber,
      type: 'sms'
    }

    plivo.send_message(params, Meteor.bindEnvironment((status, response) => {
      if (status === 202) {
        const serviceMessageId = response.message_uuid[0]
        onSuccess(serviceMessageId)
      } else {
        onError()
      }
    }))
  }
}

export const sendMessage = new ValidatedMethod({
  name: 'messages.send',
  validate: new SimpleSchema({
    contactNumber: { type: String },
    userNumber: { type: String },
    text: { type: String },
    campaignId: { type: String }
  }).validator(),
  run({ text, userNumber, contactNumber, campaignId }) {
    if (Meteor.isServer) {

      const onSuccess = (serviceMessageId) => {
        const message = {
          userNumber,
          contactNumber,
          text,
          campaignId,
          serviceMessageId,
          isFromContact: false,
        }

        insertMessage.call(message)
      }

      const onError = () => console.log("Couldn't create message")

      remoteCreateMessage(text, userNumber, contactNumber, onSuccess, onError)
    }
  }
})