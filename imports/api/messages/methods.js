import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Messages } from './messages.js'
import { Campaigns } from '../campaigns/campaigns.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { OptOuts } from '../opt_outs/opt_outs.js'
import { Meteor } from 'meteor/meteor'
// FIXME - this is used in parse_csv too
const getFormattedPhoneNumber = (cell) => {
  const { NumberParseException, PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber')
  const phoneUtil = PhoneNumberUtil.getInstance()

  try {
    console.log("CELL", cell)
    const inputNumber = phoneUtil.parse(cell, "US")
    const isValid = phoneUtil.isValidNumber(inputNumber)
    console.log("isvalid", isValid)
    if (isValid) {
      return phoneUtil.format(inputNumber, PhoneNumberFormat.E164)
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
    return null
  }
}

const getAssignedPhoneNumber = (userId, onSuccess) => {
  if (!Meteor.settings.public.textingEnabled) {
    const result = Meteor.settings.private.plivo.fromPhoneNumber
    Meteor.users.update({_id: userId}, { $set: { userNumber: result } })
    onSuccess(result)
  } else {
    if (Meteor.isServer) {
      console.log("require plivo", require('plivo'))
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
          plivo.buy_phone_number({number: userNumber, appId: Meteor.settings.private.plivo.appId }, Meteor.bindEnvironment(function (status, response) {
              console.log('Status: ', status);
              console.log('API Response:\n', response);
              if (status === 201) {
                const result = getFormattedPhoneNumber(userNumber)
                if (result) {
                  Meteor.users.update({_id: userId}, { $set: { userNumber: result } })
                  onSuccess(result)
                } else {
                  throw new Meteor.Error(500, 'plivo-error', 'could not format response from plivo')
                }
              }
          }))
        }
        else {
          throw new Meteor.Error(500, 'plivo-error', 'error purchasing number from plivo')
        }
      }))
    }
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

    const createdAt = new Date()
    const user = Meteor.users.findOne({ userNumber })
    const message = {
      userNumber,
      contactNumber,
      isFromContact,
      text,
      campaignId,
      serviceMessageId,
      createdAt,
      userId: user._id
    }

    console.log("inserting message!", message)
    Messages.insert(message)

    console.log("HERE")
    // TODO: Cache -- is this ok?
    const contact = CampaignContacts.findOne({ campaignId, cell: contactNumber })

    const lastMessage = {
      isFromContact
    }
    console.log("last Message", lastMessage)
    console.log("HERE 2")
    CampaignContacts.update( { _id: contact._id }, { $set: { lastMessage }})
    console.log("HERE 3")
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
    const plivo = require('plivo').RestAPI({
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
        console.log(response)
        throw new Meteor.Error('message-send-error');
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