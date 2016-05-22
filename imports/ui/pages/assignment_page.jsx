import React from 'react'
import { AssignmentSummary } from '../components/assignment_summary'
import { BackNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import { AssignmentTexter } from '../../ui/components/assignment_texter'

export class AssignmentPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentTextingContacts: []
    }
  }

  onStopTexting() {
    this.setState({ currentTextingContacts: [] })
  }

  summaryPageContent() {
    const { assignment } = this.props

    return (
      <AssignmentSummary
        assignment={assignment}
        contacts={assignment.contacts().fetch()}
        onStartTexting={this.onStartTexting.bind(this)}
      />
    )
  }

  onStartTexting(currentTextingContacts) {
    this.setState({ currentTextingContacts })
    console.log("on test", "currentTextingContacts")
  }

  summaryPageNavigation() {
    const { assignment, organizationId } = this.props

    return (
      <BackNavigation
        organizationId={organizationId}
        title={assignment.campaign().title}
        backToSection="assignments"
      />
    )
  }

  summaryPage() {
    const { loading } = this.props
    return (
      <AppPage
        navigation={loading ? '' : this.summaryPageNavigation() }
        content={loading ? '' : this.summaryPageContent()}
        loading={loading}
      />
    )
  }

  texterPage() {
    const { assignment } = this.props
    const { currentTextingContacts } = this.state
    const texter = (
      <AssignmentTexter
        assignment={assignment}
        contacts={currentTextingContacts}
        onStopTexting={this.onStopTexting.bind(this)}
      />
    )

    return texter
  }
  render() {
    const { currentTextingContacts } = this.state
    console.log("currentTextingContacts", currentTextingContacts)
    return currentTextingContacts.length > 0 ? this.texterPage() : this.summaryPage()
  }
}

AssignmentPage.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  assignments: React.PropTypes.array,   // all assignments for showing in sidebar
  loading: React.PropTypes.bool,     // subscription status
  contacts: React.PropTypes.array,   // contacts for current assignment
  organizationId: React.PropTypes.string
}
