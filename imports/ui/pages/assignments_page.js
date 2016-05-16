import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { CampaignList } from '../components/campaign_list'
import { CampaignForm } from '../components/campaign_form'
import Subheader from 'material-ui/Subheader';
import FlatButton from 'material-ui/FlatButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import {List, ListItem} from 'material-ui/List';
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card'


export const AssignmentsPage = ({ assignments }) => (
  <Paper>
      <AppBar
        title="Assignments"
      />
      <List>
        { assignments.map((assignment) => (
          <ListItem
            onTouchTap={() => FlowRouter.go(`/assignments/${assignment._id}`)}
            primaryText={assignment.title}
            secondaryText={assignment.description}
          />
        ))}
      </List>
  </Paper>
)
