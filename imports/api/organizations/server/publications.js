import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Organizations } from '../organizations'

Meteor.publish('organization', (organizationId) => {
  return Organizations.find({ _id: organizationId })
})
