import { Meteor } from 'meteor/meteor';

import { Assignments } from '../assignments.js';

Meteor.publish('assignments', function assignmentsPublication() {
  // TODO: actually filter correctly and return public fields only
  return Assignments.find({});
});