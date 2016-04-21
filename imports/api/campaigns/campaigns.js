import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Fake } from 'meteor/anti:fake'

export const Campaigns = new Mongo.Collection('campaigns')

// Deny all client-side updates since we will be using methods to manage this collection
Campaigns.deny({
  insert() { return true },
  update() { return true },
  remove() { return true },
})

Campaigns.schema = new SimpleSchema({
  // userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  // TODO: I think normalization is ok here bc this should not change so DPP won't update stuff
  title: { type: String },
  description: { type: String },
  createdAt: { type: Date },
  script: { type: String },
  custom_fields: { type: [String] }
})

Campaigns.attachSchema(Campaigns.schema)

Factory.define('campaign', Campaigns, {
  createdAt: () => new Date(),
  title: () => Fake.fromArray(['Baltimore Phonebank Recruitment', 'Bernie Journey', 'NY GOTV', 'CA Phonebanking']),
  description: () => Fake.fromArray(['Invite users to canvassing', 'Sign up volunteers', 'Get out the vote!']),
  custom_fields: [],
  script: () => Fake.fromArray([
    "Hi there, <<name>>! We have an event coming up soon and we're hoping you can join us to help Bernie win! If you can, let us know!",
    'Hey <<name>>! Come help us out at this upcoming event.',
    "Hi <<name>>. We'd love to have you join us at an upcoming rally in your area. Do you think you'll be free?"
  ])
})

// This represents the keys from Campaigns objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Campaigns.publicFields = {
}
