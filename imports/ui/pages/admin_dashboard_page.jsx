import React from 'react'
import Paper from 'material-ui/Paper'
import AppBar from 'material-ui/AppBar'
import { Meteor } from 'meteor/meteor'
import { Organizations } from '../../api/organizations/organizations.js'
import { createContainer } from 'meteor/react-meteor-data'

const Dashboard = ({ organization, loading }) => (
  <Paper>
    { loading ? 'Loading' : (
        <div>
          You have no texters.
          You have no campaigns.
        </div>
    )}
  </Paper>
)

export default createContainer(({ organizationId }) => {
  console.log("organizationId", organizationId)
  const handle = Meteor.subscribe('organization', organizationId)

  console.log("Organizations.findOne({ _id: organizationId })", Organizations.findOne({ _id: organizationId }))
  return {
    organization: Organizations.findOne({ _id: organizationId }),
    loading: !handle.ready()
  }
}, Dashboard)
