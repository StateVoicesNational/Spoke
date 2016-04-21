import { Meteor } from 'meteor/meteor';

import { Assignments } from '../assignments.js';

Meteor.publish('assignments', () => {
  // TODO: actually filter correctly and return public fields only
  return Assignments.find({});
});

Meteor.publish('assignment', (assignmentId) => {
  // TODO: check if you have access
  console.log("here in assignment fetch");
  return Assignments.find({ _id: assignmentId });
});