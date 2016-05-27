import { Organizations } from '../organizations/organizations'
import { Campaigns } from '../campaigns/campaigns'
import { Assignments } from '../assignments/assignments'

export const displayName = (user) => [user.firstName, user.lastName].join(' ')
// TODO: Only doing this because Meteor.users.helpers does not seem to work
// Meteor.users.helpers({
//   displayName() {

//   }
// })

export const organizationsForUser = (user) => {
  const ids = Roles.getGroupsForUser(user)
  return Organizations.find({ _id: { $in: ids} })
}

export const todosForUser = (user, organizationId) => {
    const campaignIds = Campaigns.find({
        organizationId,
        // dueBy: {$gte: new Date()}
    }).fetch().map((campaign) => campaign._id)

    console.log("campaigns", campaignIds, user._id)
    console.log( Assignments.find({
        campaignId: { $in: campaignIds },
        userId: user._id
    }).fetch())
    return Assignments.find({
        campaignId: { $in: campaignIds },
        userId: user._id
    })
}

Meteor.users.publicFields = {
  firstName: 1,
  lastName: 1,
  assignedNumber: 1
}
