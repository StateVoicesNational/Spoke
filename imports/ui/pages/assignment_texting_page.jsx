import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Assignments } from '../../api/assignments/assignments'
import { Scripts } from '../../api/scripts/scripts'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { AssignmentTexter } from '../../ui/components/assignment_texter'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { AppPage } from '../../ui/layouts/app_page'

class _AssignmentTextingPage extends Component {
  render () {
    const { assignment, contacts, loading, organizationId, userResponses, campaignResponses } = this.props

    return  <AppPage
      loading={loading}
      content={ loading ? '' :
        <AssignmentTexter
          assignment={assignment}
          contacts={contacts}
          userResponses={userResponses}
          campaignResponses={campaignResponses}
          onStopTexting={() => FlowRouter.go('todos', { organizationId })}
        />
      }
      />
  }
}

export const AssignmentTextingPage = createContainer(({ organizationId, assignmentId, contactFilter }) => {
  const  handle = Meteor.subscribe('assignment.text', assignmentId, contactFilter, organizationId)
  const assignment = Assignments.findOne(assignmentId)

  let campaignResponses = []
  let userResponses = []

  if (assignment)
  {
    const campaignId = assignment.campaignId
    campaignResponses = Scripts.find( { campaignId, userId: null }).fetch()
    userResponses = Scripts.find( { campaignId, userId: Meteor.userId() }).fetch()
  }
  return {
    assignment,
    organizationId,
    campaignResponses,
    userResponses,
    contacts: CampaignContacts.find({}).fetch(),
    loading: !(handle && handle.ready())
  }
}, _AssignmentTextingPage)

