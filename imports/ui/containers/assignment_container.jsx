import { Meteor } from 'meteor/meteor';
import { Assignments } from '../../api/assignments/assignments.js';
import { createContainer } from 'meteor/react-meteor-data';
import { AssignmentPage } from '../pages/assignment_page';


export default createContainer(({id}) => {
  const contactsHandle = Meteor.subscribe('campaignContacts.forAssignment', id);
  const loading = !contactsHandle.ready();
  console.log("id", id);
  const assignment = Assignments.findOne(id);
  const assignmentExists = !loading && !!assignment;
  console.log("assignment", assignment, "loading", loading)

  if (assignmentExists)
    console.log(assignment.contacts().fetch())
  return {
    loading,
    assignment,
    assignmentExists,
    contacts: assignmentExists ? assignment.contacts().fetch() : [],
  };
}, AssignmentPage);
