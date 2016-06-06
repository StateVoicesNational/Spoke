import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { LoginPage } from '../pages/login_page'
import { Organizations } from '../../api/organizations/organizations'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { muiTheme } from '../../ui/theme'

export const App = createContainer(() => {
  const handle = Meteor.subscribe('organizations')

  return {
    user: Meteor.user(),
    organizations: Organizations.find({}).fetch(),
    loading: !handle.ready()
  }
}, (props) => {
  const { user, organizations, loading } = props
    // <LoginPage user={user} organizations={organizations} />

    // you suggest (I will also have the props, passed from the router)
    const content = React.cloneElement(props.content(), {
      user,
      organizations,
      loading // this may
    })

  return (
    <div>
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          { user ? content : <LoginPage user={user} organizations={organizations}  />}
        </div>
      </MuiThemeProvider>
    </div>
  )
})
