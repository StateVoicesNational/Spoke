import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Assignments } from '../../api/assignments/assignments'
import { Messages } from '../../api/messages/messages'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { AssignmentTexter } from '../../ui/components/assignment_texter'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { ContactFilters, getContactsToText, wrappedGetContactsToText} from '../../api/campaign_contacts/methods'
import { Fetcher } from 'meteor/msavin:fetcher'
import { ReactiveVar } from 'meteor/reactive-var'

class _AssignmentTextingPage extends Component {
  render () {
    const { assignment, contacts, loading, organizationId } = this.props

    return loading ? <div>Loading</div> : (
      <div>
          <AssignmentTexter
            assignment={assignment}
            contacts={contacts}
            onStopTexting={() => FlowRouter.go('todos', { organizationId })}
          />
      </div>
    )
  }
}

let retrieved = new ReactiveVar(false)
let contacts = new ReactiveVar([])
export const AssignmentTextingPage = createContainer(({ organizationId, assignmentId, contactFilter }) => {
  const  handle = Meteor.subscribe('assignment.text', assignmentId, contactFilter, organizationId)
  const assignment = Assignments.findOne(assignmentId)
  Messages.find({}).fetch() // FIXME should not just blindly fetch here
  return {
    assignment,
    organizationId,
    contacts: CampaignContacts.find({}).fetch(),
    loading: !(handle && handle.ready())
  }
}, _AssignmentTextingPage)

