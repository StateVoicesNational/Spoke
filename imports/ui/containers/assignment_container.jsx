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
    survey: null,
    contacts: [],
    messages: []
  }
  if (assignmentHandle.ready()) {
    const assignment = Assignments.findOne(id)
    data.assignment = assignment
    if (assignment)
    {
      data.contacts = assignment.contacts().fetch()
      const campaign = assignment.campaign()
      data.campaign = campaign
      data.survey = campaign.survey()
      // TODO: This is really dumb. I think I need to do one contact at a time.
      data.messages = campaign.messages().fetch()
    }
  }

  console.log("in createContainer data", data)
  return data
}, AssignmentPage)
