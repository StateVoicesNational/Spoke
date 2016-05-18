import React from 'react'
import Paper from 'material-ui/Paper'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'
import { Meteor } from 'meteor/meteor'
import { Organizations } from '../../api/organizations/organizations.js'
import { createContainer } from 'meteor/react-meteor-data'
import { TexterSignupForm } from '../components/texter_signup_form'

const Page = ({ organization, loading }) => (
  <Paper>
    { loading ? <div>Loading</div> : (
      <div>
        <AppBar
          title="Sign up to be a texter!"
        />
        <TexterSignupForm organization={organization} />
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
}, Page)
