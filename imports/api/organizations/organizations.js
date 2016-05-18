import { Mongo } from 'meteor/mongo'
import { Factory } from 'meteor/dburles:factory'
import { Fake } from 'meteor/anti:fake'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Organizations = new Mongo.Collection('organizations')

Organizations.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

Organizations.schema = new SimpleSchema({
  name: { type: String },
  createdAt: { type: Date }
})

Organizations.attachSchema(Organizations.schema)

Factory.define('organization', Organizations, {
  name: () => Fake.sentence(2),
  createdAt: () => new Date()
})

Organizations.publicFields = {
  name: 1,
  createdAt: 1
}
