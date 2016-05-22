import React from 'react'
import Paper from 'material-ui/Paper'
import AppBar from 'material-ui/AppBar'
import { Meteor } from 'meteor/meteor'
import { Organizations } from '../../api/organizations/organizations.js'
import { createContainer } from 'meteor/react-meteor-data'
import { FlowRouter } from 'meteor/kadira:flow-router'

export class AdminDashboardPage extends React.Component {
  componentWillReceiveProps({ loading }) {
    // redirect / to a list once lists are ready
    if (!loading) {
      const organization = Organizations.findOne()
      FlowRouter.go(`/${organization._id}/campaigns`)
    }
  }
  render() {
    const { loading } = this.props
    return <Paper>
      { loading ? 'Loading' : (
          <div>
            You have no texters.
            You have no campaigns.
          </div>
      )}
    </Paper>
  }
}
