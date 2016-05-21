import React from 'react'
import { AssignmentSummary } from '../components/assignment_summary'
import { BackNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'

export class AssignmentPage extends React.Component {
  getAssignedContacts() {
    const { contacts } = this.props

    console.log("assignedContacts", contacts)
    return contacts
    let assignedContacts = []

    const unmessagedContacts = contacts.filter((c) => !c.lastMessage())
    if (unmessagedContacts.length > 0) {
      assignedContacts = unmessagedContacts
    } else {
      const unrespondedContacts = contacts.filter((c) => c.lastMessage() && c.lastMessage().isFromContact)
      if (unrespondedContacts.length > 0) {
        assignedContacts = unrespondedContacts
      }
    }

    return assignedContacts
  }

  navigation() {
    const { organizationId, assignment } = this.props
    return (
      <BackNavigation
        organizationId={organizationId}
        title={assignment.campaign().title}
        backToSection='assignments'
      />
    )
  }

  content() {
    const { assignment } = this.props
    return (
      <AssignmentSummary
        assignment={assignment}
        contacts={assignment.contacts().fetch()}
      />
    )
  }

  render() {
    const { loading } = this.props
    return (
      <AppPage
        navigation={loading ? '' : this.navigation() }
        content={loading ? '' : this.content()}
        loading={loading}
      />
    )
  }
}

AssignmentPage.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  assignments: React.PropTypes.array,   // all assignments for showing in sidebar
  loading: React.PropTypes.bool,     // subscription status
  contacts: React.PropTypes.array,   // contacts for current assignment

}
