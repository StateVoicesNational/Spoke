import { Meteor } from 'meteor/meteor';
import { Assignments } from '../../api/assignments/assignments.js';
import { createContainer } from 'meteor/react-meteor-data';
import { AssignmentPage } from '../pages/assignment_page';


export default createContainer(({id}) => {
    const handle = Meteor.subscribe('assignments');
    const contactsHandle = Meteor.subscribe('campaignContacts.forAssignment', id);
    const loading = !contactsHandle.ready();

    console.log(contactsHandle.ready())
    let data = {
      assignments: Assignments.find({}).fetch(),
      assignment: null,
      contacts: []
    }
    if (handle.ready())
    {
      const assignment = Assignments.findOne(id);
      console.log("hello?!")
      data.assignment = assignment
      data.contacts = assignment.contacts().fetch()
    }
    return data
}, AssignmentPage);
