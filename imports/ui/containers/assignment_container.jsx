import { Meteor } from 'meteor/meteor';
import { Assignments } from '../../api/assignments/assignments.js';
import { createContainer } from 'meteor/react-meteor-data';
import { AssignmentPage } from '../pages/assignment_page';


export default createContainer(({id}) => {
    // Either use publish composite or figure out how not to need to refresh the assignment data here?
  const contactsHandle = Meteor.subscribe('campaignContacts.forAssignment', id);
  const loading = !contactsHandle.ready();

  console.log(contactsHandle.ready())
  let data = {
    assignment: null,
    contacts: []
  }
  if (contactsHandle.ready())
  {
    const assignment = Assignments.findOne(id);
    data.assignment = assignment
    data.contacts = assignment.contacts().fetch()
  }

  return data;
}, AssignmentPage);
