import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { LoginPage } from '../pages/login_page'
import { Organizations } from '../../api/organizations/organizations'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { muiTheme } from '../../ui/theme'
import { _PublicLayout } from '../layouts/public'
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
          {loading ? '' : (user ? content : (
            <div>
              <div className="row center-xs middle-xs" style={{height: 400}}>
                <div className="col-xs">
                  <h2>Welcome back.</h2>
                  <LoginPage user={user} organizations={organizations}  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </MuiThemeProvider>
    </div>
  )
})
