import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Organizations } from '../organizations'
import { Roles } from 'meteor/alanning:roles'

Meteor.publish('organization', (organizationId) => {
  return Organizations.find({ _id: organizationId })
})


Meteor.publish('organizations', function () {
    console.log(this.userId, "organizations pub")
  const ids = Roles.getGroupsForUser(this.userId)
  console.log("ids for user", ids)
  return Organizations.find({ _id: { $in: ids} })
})
