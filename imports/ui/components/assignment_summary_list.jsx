import React, { Component, PropTypes } from 'react';
import {List, ListItem} from 'material-ui/List';
import Badge from 'material-ui/Badge';

import Subheader from 'material-ui/Subheader';

export class AssignmentSummaryList extends Component {
  renderRow(assignment) {
    return (
      <div key={assignment._id}>
        <ListItem
          primaryText={assignment.campaign.title}
          secondaryText={assignment.campaign.description}
          disabled={true}
        />,
        <ListItem
          key={1}
          insetChildren={true}
          primaryText={<Badge primary={true} badgeContent={4}>First contact</Badge>}
        />
        <ListItem
          key={2}
          insetChildren={true}
          primaryText={<Badge primary={true} badgeContent={4}>Replies</Badge>}
        />
    </div>
    )
  }

  render() {
    const { assignments } = this.props;
    return (
        <List>
          <Subheader>Active Assignments</Subheader>
          {assignments.map(assignment => this.renderRow(assignment) )}
        </List>
    );
  }
}