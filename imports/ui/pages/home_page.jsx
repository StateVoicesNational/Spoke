import React from 'react'
import { PublicNavigation } from '../components/public_navigation'
import RaisedButton from 'material-ui/RaisedButton'
import { FlowRouter } from 'meteor/kadira:flow-router'

export const HomePage = ({ user, organizations }) => (
  <div>
    <h1>Start texting.</h1>
    <h2>Engage with your volunteers & help your supporters take action.</h2>
    <RaisedButton
      label="Create a team"
      linkButton
      href={ FlowRouter.path('createTeam') }
    />
  </div>
)
