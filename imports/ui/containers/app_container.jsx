import { Meteor } from 'meteor/meteor';
import { Assignments } from '../../api/assignments/assignments.js';
import { createContainer } from 'meteor/react-meteor-data';
import {App} from '../layouts/app';
import {TextingPage} from '../pages/texting_page';

export default createContainer(() => {
  const handle = Meteor.subscribe('assignments');
  return {
    smee: 'tree',
    assignments: Assignments.find({}).fetch(),
  };
}, TextingPage);