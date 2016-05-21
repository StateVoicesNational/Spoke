export const displayName = (user) => [user.firstName, user.lastName].join(' ')
// TODO: Only doing this because Meteor.users.helpers does not seem to work
// Meteor.users.helpers({
//   displayName() {

//   }
// })

Meteor.users.publicFields = {
  firstName: 1,
  lastName: 1,
}
