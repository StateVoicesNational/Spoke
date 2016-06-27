import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const ZipCodes = new Mongo.Collection('zip_codes')

// Deny all client-side updates since we will be using methods to manage this collection
ZipCodes.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

ZipCodes.schema = new SimpleSchema({
  zip: { type: String },
  city: { type: String },
  state: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  timezoneOffset: { type: Number },
  hasDst: { type: Boolean}
})

ZipCodes.attachSchema(ZipCodes.schema)

ZipCodes.publicFields = {
}

ZipCodes.helpers({
  campaign() {
    return Campaigns.findOne({ _id: this.campaignId })
  }
})
