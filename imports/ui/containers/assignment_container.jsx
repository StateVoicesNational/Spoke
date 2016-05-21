import { Meteor } from 'meteor/meteor'
import { Assignments } from '../../api/assignments/assignments.js'
import { SurveyAnswers } from '../../api/survey_answers/survey_answers.js'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts.js'
import { createContainer } from 'meteor/react-meteor-data'
import { AssignmentPage } from '../pages/assignment_page'


export default createContainer(({ assignmentId, organizationId }) => {
  let handle = Meteor.subscribe('assignment.allRelatedData', assignmentId)

  let data = {
    assignment: null,
    campaign: null,
    survey: null,
    contacts: [],
    messages: [],
    loading: !handle.ready(),
    organizationId
  }

  if (handle.ready()) {
    const assignment = Assignments.findOne(assignmentId)
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
    }
  }
  CampaignContacts.find({}).fetch()
  SurveyAnswers.find({}).fetch()
  return data
}, AssignmentPage)
