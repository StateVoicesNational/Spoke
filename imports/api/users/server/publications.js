import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'

Meteor.publish('texters.forOrganization', (organizationId) => {
  return Roles.getUsersInRole('texter', organizationId)
})


Meteor.publish(null, function() {
  return Meteor.users.find({ _id: this.userId})
})
