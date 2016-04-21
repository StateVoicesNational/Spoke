import React from 'react'
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
//First, we pass in any props transferred to this component
import {AssignmentSummaryList} from '../components/assignment_summary_list'
import { Assignments } from '../../api/assignments/assignments.js';
import {Texter} from '../components/texter'
import Drawer from 'material-ui/Drawer';

export class AssignmentPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {navDrawerOpen: false}
  }

  componentWillReceiveProps({ loading, assignment }) {
    // redirect / to an assignment if possible
    if (!loading && !assignment) {
      const assignment = Assignments.findOne();
      FlowRouter.go("/assignments/" + assignment._id);
    }
  }

  handleTouchTapLeftIconButton() {
    this.setState({
      navDrawerOpen: !this.state.navDrawerOpen,
    });
  }

  onChangeList(assignmentId) {
    FlowRouter.go('/assignments/' + assignmentId);
    this.setState({navDrawerOpen: false})
  }
    render () {
      const {assignment, assignments, contacts, loading} = this.props;
     return <div>
        <Drawer open={this.state.navDrawerOpen}
        docked={false}
        onRequestChange={(navDrawerOpen) => this.setState({navDrawerOpen})}
>

          <AssignmentSummaryList onChangeList={this.onChangeList.bind(this)} assignments={assignments}/>
        </Drawer>
        <AppBar title="Townsquare Texting"
        onLeftIconButtonTouchTap={this.handleTouchTapLeftIconButton.bind(this)}
                />
        {assignment && contacts.length > 0 ? <Texter assignment={assignment} contacts={contacts} /> : ''}
      </div>
    }
}