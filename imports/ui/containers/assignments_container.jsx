import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { createContainer } from 'meteor/react-meteor-data'
import { AssignmentsPage } from '../pages/assignments_page'


export default createContainer(() => {
  const handle = Meteor.subscribe('assignments')

  return {
    assignments: Campaigns.find({}).fetch(),
    loading: !handle.ready()
  }
}, AssignmentsPage)
