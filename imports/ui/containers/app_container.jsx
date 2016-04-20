import { Meteor } from 'meteor/meteor';
import { Assignments } from '../../api/assignments/assignments.js';
import { createContainer } from 'meteor/react-meteor-data';
import {App} from '../layouts/app';
import {AssignmentListPage} from '../pages/assignment_list_page';

export default createContainer(() => {
  const handle = Meteor.subscribe('assignments');
  return {
    assignments: Assignments.find({}).fetch(),
  };
}, AssignmentListPage);