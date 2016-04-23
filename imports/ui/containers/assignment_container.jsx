import { Meteor } from 'meteor/meteor'
import { Assignments } from '../../api/assignments/assignments.js'
import { createContainer } from 'meteor/react-meteor-data'
import { AssignmentPage } from '../pages/assignment_page'


export default createContainer(({ id }) => {
  Meteor.subscribe('assignments')
  const assignmentHandle = Meteor.subscribe('assignment.allRelatedData', id)

  let data = {
    assignments: Assignments.find({}).fetch(),
    assignment: null,
    campaign: null,
    surveys: [],
    contacts: [],
  }
  if (assignmentHandle.ready()) {
    const assignment = Assignments.findOne(id)
    data.assignment = assignment
    if (assignment)
    {
      data.contacts = assignment.contacts().fetch()
      const campaign = assignment.campaign()
      data.campaign = campaign
      data.surveys = campaign.surveys().fetch()
    }
  }

  console.log("in createContainer data", data)
  return data
}, AssignmentPage)
