import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Messages } from './messages.js'
import { Campaigns } from '../campaigns/campaigns.js'
import { OptOuts } from '../opt_outs/opt_outs.js'
import { Meteor } from 'meteor/meteor'

const getAssignedPhoneNumber = (userId, onSuccess, onError) => {

  if (Meteor.isServer) {
    const plivo = require('plivo').RestAPI({
      authId: Meteor.settings.private.plivo.authId,
      authToken: Meteor.settings.private.plivo.authToken
    })

    const params = {
        'country_iso': 'US', // The ISO code A2 of the country
        'type' : 'national', // The type of number you are looking for. The possible number types are local, national and tollfree.
        // 'pattern' : '210', // Represents the pattern of the number to be searched.
        // 'region' : 'Texas' // This filter is only applicable when the number_type is local. Region based filtering can be performed.
    };

    plivo.search_phone_numbers(params, Meteor.bindEnvironment((status, response) => {
      if (status === 200) {
        const userNumber = response.objects[0].number
        console.log("got some respnoses", userNumber, userId)
        Meteor.users.update(userId, { $set: { userNumber } })
        onSuccess(userNumber)
      }
      else {
        console.log("oops, looks like we did not get a number")
        onError()
      }
    }))
  }
}


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

    // TODO: Not sure about this pattern?
    if (Meteor.isServer) {
      const organizationId = Campaigns.findOne({ _id: campaignId }).organizationId

      if (!this.userId || !Roles.userIsInRole(this.userId, 'texter', organizationId)) {
        throw new Meteor.Error('not-authorized');
      }

      const optOut = OptOuts.findOne({
        organizationId,
        cell: contactNumber
      })

      if (optOut) {
        throw new Meteor.Error('contact-opt-out');
      }

    }


    const message = {
      userNumber,
      contactNumber,
      isFromContact,
      text,
      campaignId,
      serviceMessageId,
      createdAt: new Date(),
      userId: this.userId
    }

    console.log("inserting message!", message)
    Messages.insert(message)
  }
})

const remoteCreateMessage = (text, userNumber, contactNumber, campaignId, onError) => {
  const onMessageSendSuccess = (serviceMessageId) => {
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

  if (!Meteor.settings.public.isProduction && !Meteor.settings.public.textingEnabled) {
    console.log("Faking message sending")
    onMessageSendSuccess('fake_message_id')
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
        onMessageSendSuccess(serviceMessageId)
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
    text: { type: String },
    campaignId: { type: String }
  }).validator(),
  run({ text, contactNumber, campaignId }) {
    if (Meteor.isServer) {
      const user = Meteor.users.findOne({_id: this.userId})
      if (!user.userNumber) {
        getAssignedPhoneNumber(this.userId, (userNumber) => {
          remoteCreateMessage(text, userNumber, contactNumber, campaignId)
        })
      }
      else {
        remoteCreateMessage(text, user.userNumber, contactNumber, campaignId)
      }
    }
  }
})