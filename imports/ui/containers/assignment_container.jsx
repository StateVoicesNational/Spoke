import { Meteor } from 'meteor/meteor';
import { Assignments } from '../../api/assignments/assignments.js';
import { createContainer } from 'meteor/react-meteor-data';
import { AssignmentPage } from '../pages/assignment_page';


export default createContainer(({id}) => {
    // Either use publish composite or figure out how not to need to refresh the assignment data here?
  const contactsHandle = Meteor.subscribe('campaignContacts.forAssignment', id);
  const assignmentHandle = Meteor.subscribe('assignment', id);
  const loading = !contactsHandle.ready() || !assignmentHandle.ready();

  let assignment;
  let contacts = []
  if (assignmentHandle.ready())
  {
    console.log("did this ever happen?");
    const assignment = Assignments.findOne(id);
    contacts = assignment.contacts().fetch()
  }

  return {
    loading,
    assignment,
    contacts
  };
}, AssignmentPage);
