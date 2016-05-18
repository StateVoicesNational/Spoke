import { Meteor } from 'meteor/meteor'
import { Assignments } from '../../api/assignments/assignments.js'
import { createContainer } from 'meteor/react-meteor-data'
import { AssignmentsPage } from '../pages/assignments_page'


export default createContainer(() => {
  const handle = Meteor.subscribe('assignments')

  return {
    assignments: Assignments.find({}).fetch(),
    loading: !handle.ready()
  }
}, AssignmentsPage)
