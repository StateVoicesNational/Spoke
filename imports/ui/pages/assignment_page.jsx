import React from 'react'
import { AssignmentSummaryList } from '../components/assignment_summary_list'
import { Assignments } from '../../api/assignments/assignments.js'
import { Texter } from '../components/texter'
import { AssignmentSummary } from '../components/assignment_summary'
import { FlowRouter } from 'meteor/kadira:flow-router'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'

export class AssignmentPage extends React.Component {
  constructor(props) {
    super(props)
    this.handleTouchTapLeftIconButton = this.handleTouchTapLeftIconButton.bind(this)
    this.onChangeAssignment = this.onChangeAssignment.bind(this)
    this.state = { navDrawerOpen: false }
  }

  componentWillReceiveProps({ loading, assignment }) {
    // redirect / to an assignment if possible
    // TODO this is not the right way to do this and there may not be an assignment
    if (!loading && !assignment) {
      const newAssignment = Assignments.findOne()
      this.navigateToAssignmentId(newAssignment._id)
    }
  }

  onChangeAssignment(assignmentId) {
    this.navigateToAssignmentId(assignmentId)
    this.setState({ navDrawerOpen: false })
  }

  navigateToAssignmentId(assignmentId) {
    FlowRouter.go(`/assignments/${assignmentId}`)
  }

  handleTouchTapLeftIconButton() {
    this.setState({
      navDrawerOpen: !this.state.navDrawerOpen
    })
  }

  render() {
    const { assignment, assignments, contacts, messages, survey } = this.props
    const unmessagedContacts = contacts.filter(contact => !contact.lastMessage);
    // if (unmessagedContacts.length > 0) {
    //   return <Texter assignment={assignment} contacts={unmessagedContacts} surveys={surveys} />
    // } else {
    //   const unrespondedContacts = contacts.filter(contact => contact.lastMessage.isFromContact);
    //   if (unrespondedContacts.length > 0) {
    //     return <Texter assignment={assignment} contacts={unrespondedContacts} surveys={surveys} />
    //   } else {
    //     return <div>You have nothing to respond to right now! Great job</div>
    //   }
    // }
    return (<div>
      <Drawer open={this.state.navDrawerOpen}
        docked={false}
        onRequestChange={(navDrawerOpen) => this.setState({ navDrawerOpen })}
      >
        <AssignmentSummaryList onChangeList={this.onChangeAssignment} assignments={assignments} />
      </Drawer>
      <AppBar
        title="Townsquare Texting"
        onLeftIconButtonTouchTap={this.handleTouchTapLeftIconButton}
      />
      <div>
        You have {unmessagedContacts.length } unmessaged contacts.
        You have { contacts.length } total contacts
      </div>
      <div>
        <div className="row">
          <div className="col-xs-12 col-sm-3 col-md-2 col-lg-1">
            <div className="box-row">
            </div>
          </div>
          <div className="col-xs-6 col-sm-6 col-md-8 col-lg-10">
              <div className="box-row">
                <AssignmentSummary
                  messages={messages}
                  assignment={assignment}
                  contacts={contacts}
                  survey={survey}
                />
              </div>
            </div>
          </div>
        </div>
    </div>)
  }
}

AssignmentPage.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  assignments: React.PropTypes.array,   // all assignments for showing in sidebar
  messages: React.PropTypes.array,   // all assignments for showing in sidebar
  loading: React.PropTypes.bool,     // subscription status
  contacts: React.PropTypes.array,   // contacts for current assignment
  survey: React.PropTypes.object,   // contacts for current assignment
  campaign: React.PropTypes.object   // contacts for current assignment

}
