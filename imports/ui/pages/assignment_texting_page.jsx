import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { getContactsToText, ContactFilters } from '../../api/campaign_contacts/methods'
import { Assignments } from '../../api/assignments/assignments'
import { Messages } from '../../api/messages/messages'
import { AssignmentTexter } from '../../ui/components/assignment_texter'

class _AssignmentTextingPage extends Component {
  componentDidMount() {

  }

  render () {
    const { assignment, contacts, loading} = this.props
    return loading ? <div>Loading</div> : (
      <div>
          <AssignmentTexter
            assignment={assignment}
            contacts={contacts}
            // onStopTexting={this.onStopTexting.bind(this)}
          />
        )
      </div>
    )
  }
}

export const AssignmentTextingPage = createContainer(({ organizationId, assignmentId, contactFilter }) => {
  const handle = Meteor.subscribe('assignment.text', assignmentId, contactFilter)

  const assignment = Assignments.findOne(assignmentId)
  Messages.find({}).fetch() // FIXME should not just blindly fetch here
  return {
    assignment,
    contacts: assignment ? assignment.contacts(contactFilter).fetch() : [],
    loading: !handle.ready()
  }
}, _AssignmentTextingPage)

