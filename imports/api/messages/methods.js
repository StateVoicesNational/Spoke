import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Messages } from './messages.js'
import { Campaigns } from '../campaigns/campaigns.js'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js'
import { OptOuts } from '../opt_outs/opt_outs.js'
import { Meteor } from 'meteor/meteor'
import { Plivo } from './plivo'
import { getFormattedPhoneNumber } from '../../../both/phone_format'
import { isBetweenTextingHours } from '../../../both/timezones'

const getAssignedPhoneNumber = (userId) => {
  if (!Meteor.settings.public.textingEnabled) {
    return Meteor.settings.private.plivo.fromPhoneNumber
  } else {
    if (Meteor.isServer) {
      const params = {
        'country_iso': 'US', // The ISO code A2 of the country
        'type': 'national' // The type of number you are looking for. The possible number types are local, national and tollfree.
          // 'pattern' : '210', // Represents the pattern of the number to be searched.
          // 'region' : 'Texas' // This filter is only applicable when the number_type is local. Region based filtering can be performed.
      }


      const searchNumbers = Meteor.wrapAsync(Plivo.searchNumbers, Plivo)
      let response = searchNumbers(params)
      if (response.statusCode !== 200)
      {
        throw new Meteor.Error(500, 'plivo-error', 'Could not find a number to buy')
      }
      const userNumber = response.data.objects[1].number

      const buyNumber = Meteor.wrapAsync(Plivo.buyNumber, Plivo)
      response = buyNumber({ number: userNumber, app_id: Meteor.settings.private.plivo.appId })
      console.log('RESPONSE', response)
      if (response.statusCode !== 201)
      {
        throw new Meteor.Error(500, 'plivo-error', 'Could not buy number')
      }

      const formattedNumber = getFormattedPhoneNumber(userNumber)
      if (!formattedNumber) {
        throw new Meteor.Error(500, 'plivo-error', 'could not format phone number')
      }

      return formattedNumber
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

    Messages.insert(message)

    // TODO: Cache -- is this ok?
    const contact = CampaignContacts.findOne({ campaignId, cell: contactNumber })

    const lastMessage = {
      isFromContact
    }
    CampaignContacts.update({ _id: contact._id }, { $set: { lastMessage } })
  }
})

const remoteCreateMessage = (params) => {
  if (!Meteor.settings.public.isProduction && !Meteor.settings.public.textingEnabled) {
    return 'fake_message_id'
  }
  else {
    const sendMessage = Meteor.wrapAsync(Plivo.sendMessage, Plivo)
    const response = sendMessage(params)
    if (response.statusCode !== 202) {
      throw new Meteor.Error('message-send-error')
    }

    const serviceMessageId = response.data.message_uuid[0]
    return serviceMessageId
  }
}

const createMessage = ({ text, userNumber, contactNumber, campaignId }) => {
  const params = {
    text,
    src: userNumber, // Caller Id
    dst: contactNumber,
    type: 'sms'
  }

  const serviceMessageId = remoteCreateMessage(params)

  const message = {
    userNumber,
    contactNumber,
    text,
    campaignId,
    serviceMessageId,
    isFromContact: false
  }
  return insertMessage.call(message)
}

const checkOptOut = ({ organizationId, contactNumber }) => {
  const optOut = OptOuts.findOne({
    organizationId,
    cell: contactNumber
  })

  if (optOut) {
    throw new Meteor.Error('contact-opt-out')
  }
}
export const sendMessage = new ValidatedMethod({
  name: 'messages.send',
  validate: new SimpleSchema({
    contactNumber: { type: String },
    text: { type: String },
    campaignId: { type: String },
    timezoneOffset: { type: Number, optional: true }
  }).validator(),
  run({ text, contactNumber, campaignId, timezoneOffset }) {
    // TODO: Not sure about this pattern?
    throw new Meteor.Error('message-send-timezone-error', "It's outside of texting hours for this contact")
    if (Meteor.isServer) {
      if (!isBetweenTextingHours(timezoneOffset)) {
        throw new Meteor.Error('message-send-timezone-error', "It's outside of texting hours for this contact")
      }

      const organizationId = Campaigns.findOne({ _id: campaignId }).organizationId

      if (!this.userId || !Roles.userIsInRole(this.userId, 'texter', organizationId)) {
        throw new Meteor.Error('not-authorized')
      }

      checkOptOut({ organizationId, contactNumber })

      const user = Meteor.users.findOne({ _id: this.userId })
      let userNumber = user.userNumber

      if (!userNumber) {
        userNumber = getAssignedPhoneNumber(this.userId)
        Meteor.users.update({ _id: this.userId }, { $set: { userNumber } })
      }

      createMessage({ text, userNumber, contactNumber, campaignId })
    }
  }
})
