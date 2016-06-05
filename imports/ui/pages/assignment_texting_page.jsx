import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Assignments } from '../../api/assignments/assignments'
import { Messages } from '../../api/messages/messages'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { AssignmentTexter } from '../../ui/components/assignment_texter'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { ContactFilters, getContactsToText, wrappedGetContactsToText} from '../../api/campaign_contacts/methods'
import { Fetcher } from 'meteor/msavin:fetcher'

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
        )
      </div>
    )
  }
}

export const AssignmentTextingPage = createContainer(({ organizationId, assignmentId, contactFilter }) => {
  // const contacts = getContactsToText.call({ assignmentId, contactFilter })

  let handle = null
  let contacts = []
  Fetcher.retrieve("contacts", "campaignContacts.getContactsToText", { assignmentId, contactFilter })

  if (Fetcher.get('contacts')) {
    const transformed = Fetcher.get('contacts').map((contact) => CampaignContacts._transform(contact))
    contacts =  transformed
    handle = Meteor.subscribe('assignment.text', assignmentId, Fetcher.get('contacts') , organizationId)
  }

  const assignment = Assignments.findOne(assignmentId)


  Messages.find({}).fetch() // FIXME should not just blindly fetch here
  return {
    assignment,
    organizationId,
    contacts,
    loading: !(handle && handle.ready())
  }
}, _AssignmentTextingPage)

