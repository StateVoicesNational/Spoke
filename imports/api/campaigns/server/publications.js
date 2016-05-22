import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../campaigns.js'
import { Roles } from 'meteor/alanning:roles'

Meteor.publish('campaigns', function campaignsPublication(organizationId) {
  console.log("here 1")
  if (!this.userId) {
    return this.ready();
  }

  console.log("here 2")

  const user = Meteor.users.findOne({_id: this.userId})
  if (!Roles.userIsInRole(this.userId, 'admin', organizationId)) {
    console.log(this.userId, organizationId)
    return this.ready()
  }

  console.log("got here!")
  return [
    Campaigns.find({ organizationId }),
    Roles.getUsersInRole('texter', organizationId)
  ];
})

