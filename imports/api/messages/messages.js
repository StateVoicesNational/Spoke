import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts'
export const Messages = new Mongo.Collection('messages')

// Deny all client-side updates since we will be using methods to manage this collection
Messages.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

Messages.schema = new SimpleSchema({
  contactNumber: { type: String },
  userNumber: { type: String },
  userId: { type: String }, // theoretically the phone number userNumber should stay constant for a texter, but this is not guaranteed
  campaignId: { type: String },
  createdAt: { type: Date },
  isFromContact: { type: Boolean },
  text: { type: String },
  serviceMessageId: { type: String }
})

Messages.attachSchema(Messages.schema)

Factory.define('message', Messages, {
  contactNumber: () => Meteor.settings.plivo.testPhoneNumbers.sheena,
  userNumber: () => Meteor.settings.plivo.fromPhoneNumber,
  userId: () => 'abcd',
  campaignId: () => Factory.get('campaign'),
  createdAt: () => new Date(),
  isFromContact: () => Fake.fromArray([true, false]),
  text: () => Fake.sentence(15),
  serviceMessageId: () => Fake.word(10)
})

Messages.publicFields = {
}

Messages.helpers({
  campaignContact() {
    return CampaignContacts.findOne({ campaignId: this.campaignId, cell: this.contactNumber })
  }
})
