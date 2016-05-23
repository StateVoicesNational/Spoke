import { Organizations } from '../organizations/organizations'
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

Meteor.users.publicFields = {
  firstName: 1,
  lastName: 1,
  assignedNumber: 1
}
