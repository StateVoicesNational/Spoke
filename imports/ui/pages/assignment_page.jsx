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
    this.onChangeList = this.onChangeList.bind(this)
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

  onChangeList(assignmentId) {
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
    const { assignment, assignments, contacts, surveys } = this.props
    return (<div>
      <Drawer open={this.state.navDrawerOpen}
        docked={false}
        onRequestChange={(navDrawerOpen) => this.setState({ navDrawerOpen })}
      >
        <AssignmentSummaryList onChangeList={this.onChangeList} assignments={assignments} />
      </Drawer>
      <AppBar
        title="Townsquare Texting"
        onLeftIconButtonTouchTap={this.handleTouchTapLeftIconButton}
      />
      <AssignmentSummary assignment={assignment} contacts={contacts} surveys={surveys}/>
    </div>)
  }
}

AssignmentPage.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  assignments: React.PropTypes.array,   // all assignments for showing in sidebar
  loading: React.PropTypes.bool,     // subscription status
  contacts: React.PropTypes.array,   // contacts for current assignment
  surveys: React.PropTypes.array,   // contacts for current assignment
  campaign: React.PropTypes.object   // contacts for current assignment

}
