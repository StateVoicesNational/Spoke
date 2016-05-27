import React from 'react'
import { List, ListItem } from 'material-ui/List'
import { FlowRouter } from 'meteor/kadira:flow-router'

export const AssignmentsList = ({ assignments, organizationId }) => (
    <List>
      { assignments.map((assignment) => (
        <ListItem
          key={assignment._id}
          onTouchTap={() => FlowRouter.go(assignment, { organizationId, assignmentId: assignment._id })}
          primaryText={assignment.campaign().title}
          secondaryText={assignment.campaign().description}
        />
      ))}
    </List>
)
