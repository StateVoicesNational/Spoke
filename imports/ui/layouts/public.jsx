import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { LoginPage } from '../pages/login_page'
import { Organizations } from '../../api/organizations/organizations'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { muiTheme } from '../../ui/theme'
import { PublicNavigation } from '../components/public_navigation'

const styles = {
  container: {
    maxWidth: 600,
    margin: '24px auto'
  }
}
export const Public = createContainer(() => {
  const user = Meteor.user()
  const handle = Meteor.subscribe('organizations')
  const organizations = Organizations.find({}).fetch()

  return {
    user,
    organizations,
    loading: !handle.ready()
  }
}, (props) => {
  const { user, organizations, loading } = props

    // you suggest (I will also have the props, passed from the router)
    const content = React.cloneElement(props.content(), {
      user,
      organizations,
      loading // this may
    })

  return (
    <div style={{height: '100%'}}>
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          { content }
        </div>
      </MuiThemeProvider>
    </div>
  )
})
