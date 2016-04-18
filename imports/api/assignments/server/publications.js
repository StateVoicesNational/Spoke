import { Meteor } from 'meteor/meteor';

import { Assignments } from '../assignments.js';

Meteor.publish('assignments', function assignmentsPublication() {
  // TODO: actually filter correctly
  return Assignments.find({});
});