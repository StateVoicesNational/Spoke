import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { LoginPage } from '../pages/login_page'
import { Organizations } from '../../api/organizations/organizations'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import { PublicNavigation } from '../components/public_navigation'

const muiTheme = getMuiTheme()

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
    <div>
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <PublicNavigation  user={user} organizations={organizations} />
          <div className="wrap container-fluid" style={styles.container}>
            <div className="row">
              <div className='col-xs'>
                  <div className="box">
                    { content }
                  </div>
              </div>
            </div>
          </div>

        </div>
      </MuiThemeProvider>
    </div>
  )
})
