import { Meteor } from 'meteor/meteor'

import { Assignments } from '../assignments.js'

Meteor.publish('assignments', () =>
  // TODO: actually filter correctly and return public fields only
  Assignments.find({})
)

Meteor.publish('assignment', (assignmentId) =>
  // TODO: check if you have access
  Assignments.find({ _id: assignmentId })
)
