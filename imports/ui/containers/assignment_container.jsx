import { Meteor } from 'meteor/meteor'
import { Assignments } from '../../api/assignments/assignments.js'
import { SurveyAnswers } from '../../api/survey_answers/survey_answers.js'
import { createContainer } from 'meteor/react-meteor-data'
import { AssignmentPage } from '../pages/assignment_page'


export default createContainer(({ id }) => {
  Meteor.subscribe('assignments')
  const handle = Meteor.subscribe('assignment.allRelatedData', id)

  let data = {
    assignments: Assignments.find({}).fetch(),
    assignment: null,
    campaign: null,
    survey: null,
    contacts: [],
    messages: [],
    loading: !handle.ready()
  }
  if (handle.ready()) {
    const assignment = Assignments.findOne(id)
    data.assignment = assignment
    if (assignment)
    {
      data.contacts = assignment.contacts().fetch()
      const campaign = assignment.campaign()
      data.campaign = campaign
      // TODO: This is really dumb. I think I need to do one contact at a time.
      data.messages = campaign.messages().fetch()
      data.survey = campaign.survey()
      // TODO is it ok to fetch things that are never referenced directly in the container?
      SurveyAnswers.find({}).fetch()
    }
  }

  return data
}, AssignmentPage)
