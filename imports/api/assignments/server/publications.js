import { Meteor } from 'meteor/meteor';

import { Assignments } from '../assignments.js';

Meteor.publish('assignments', function assignmentsPublication() {
  // TODO: actually filter correctly and return public fields only
  return Assignments.find({});
});

Meteor.publish('assignment', function (assignmentId) {
  // TODO: check if you have access
  console.log("here in assignment fetch");
  return Assignments.find({ _id: assignmentId });
});