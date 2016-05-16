import React, { Component, PropTypes } from 'react';
import {List, ListItem} from 'material-ui/List';
import Badge from 'material-ui/Badge';
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import Subheader from 'material-ui/Subheader';
import {FlowRouter} from 'meteor/kadira:flow-router'

export class AssignmentSummaryList extends Component {
  constructor(props) {
    super(props);
    this.state = { selectedIndex: 1 }
  }

  handleUpdateSelectedIndex(e,index) {
    this.setState({selectedIndex: index})
  }

  handleClick (assignmentId, contactType) {
    FlowRouter.go('/assignments/' + assignmentId);
  }

  renderRow (assignment) {
    const {onChangeList} = this.props
    const assignmentId = assignment._id

    return (
        <ListItem
          key={assignmentId}
          primaryText={assignment.campaign().title}
          secondaryText={assignment.campaign().description}
          disabled={true}
          initiallyOpen={true}
          primaryTogglesNestedList={false}
          autoGenerateNestedIndicator={false}
          nestedItems={[
            <ListItem
              key={"uncontacted"}
              onClick={onChangeList.bind(this, assignmentId, "uncontacted")}
              primaryText={<Badge primary={true} badgeContent={14}>First contact</Badge>}
            />,
            <ListItem
              key={"replies"}
              onClick={onChangeList.bind(this, assignmentId, "replies")}
              primaryText={<Badge primary={true} badgeContent={4}>Replies</Badge>}
            />]
          }
        />
    )
  }

  render() {
    const { assignments } = this.props;
    return (
        <List
          valueLink={{
            value: this.state.selectedIndex,
            requestChange: this.handleUpdateSelectedIndex
          }}>
          <Subheader>Active Assignments</Subheader>
          {assignments.map(assignment => this.renderRow(assignment) )}
        </List>
    );
  }
}