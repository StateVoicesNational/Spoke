import React from 'react'
import Paper from 'material-ui/Paper'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'

export const AssignmentsPage = ({ assignments }) => (
  <Paper>
      <AppBar
        title="Assignments"
      />
      <List>
        { assignments.map((assignment) => (
          <ListItem
            key={assignment._id}
            onTouchTap={() => FlowRouter.go(`/assignments/${assignment._id}`)}
            primaryText={assignment.campaign().title}
            secondaryText={assignment.campaign().description}
          />
        ))}
      </List>
  </Paper>
)
