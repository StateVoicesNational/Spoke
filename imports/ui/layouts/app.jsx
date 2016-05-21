import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Login } from '../components/login'
import { Organizations } from '../../api/organizations/organizations'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
const muiTheme = getMuiTheme()

export const App = createContainer(() => {
  const user = Meteor.user()
  const handle = Meteor.subscribe('organizations')
  const organizations = Organizations.find({})

  return {
    user,
    organizations,
    loading: !handle.ready()
  }
}, (props) => {
  const { user, organizations } = props

  return (
    <div>
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <Login user={user} organizations={organizations} />
          {props.navigation()}
          {props.content()}
        </div>
      </MuiThemeProvider>
    </div>
  )
})
