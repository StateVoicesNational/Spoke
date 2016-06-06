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
  },
  page: {
    backgroundColor: muiTheme.palette.primary1Color,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  header: {
    padding: "48px 24px",
    boxSizing: "border-box",
    overflow: 'hidden',
    backgroundColor: muiTheme.palette.primary1Color,
    color: "white",
  },
  navigation: {
    backgroundColor: muiTheme.palette.primary1Color
  },
  row: {
    height: 400
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
    <div>
      <MuiThemeProvider muiTheme={muiTheme}>
        <div style={styles.page}>
          <PublicNavigation
            toolbarStyle={styles.navigation}
            user={user}
            orgainzations={organizations}
          />
          <div style={styles.header}>
            <div className="container-fluid" style={styles.container}>
              <div className="row center-xs middle-xs" style={styles.row}>
                <div className="col-xs">
                  {content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MuiThemeProvider>
    </div>
  )
})
