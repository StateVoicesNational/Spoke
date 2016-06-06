import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Organizations } from '../organizations'
import { Roles } from 'meteor/alanning:roles'

Meteor.publish('organization', (organizationId) => {
  return Organizations.find({ _id: organizationId })
})


Meteor.publishComposite('organizations', function () {
return {
    find: () =>  Meteor.users.find({ _id: this.userId }),
    children: [
        {
            find: (user) =>  Organizations.find({ _id: { $in: Roles.getGroupsForUser(this.userId) } })
        }
    ]
}
})
