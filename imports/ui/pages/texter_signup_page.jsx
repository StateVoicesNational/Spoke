import React from 'react'
import Paper from 'material-ui/Paper'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'
import { Meteor } from 'meteor/meteor'
import { Organizations } from '../../api/organizations/organizations.js'
import { createContainer } from 'meteor/react-meteor-data'
import { TexterSignup } from '../components/texter_signup'
import { AppPage } from '../layouts/app_page'
import { Login} from '../components/login'
import { Roles } from 'meteor/alanning:roles'



class Page extends React.Component {
  componentWillReceiveProps({organization, user}) {
    if (organization && user) {
      console.log("texter roles", Roles.userIsInRole(user, 'texter', organization._id))
      if (Roles.userIsInRole(user, 'texter', organization._id)) {
        FlowRouter.go(`/${organization._id}/assignments`)
      }
    }
  }

  render() {
    const { organization, organizations, loading, user } = this.props
    return (
      <div>
          <Login user={user} organizations={organizations} />
          <AppPage
            navigation=''
            content={
              loading ? 'Loading' : <TexterSignup user={user} organization={organization} />
            }
          />
      </div>
    )

  }
}

export default createContainer(({ organizationId, organizations }) => {
  const handle = Meteor.subscribe('organization', organizationId)
  return {
    organizations,
    organization: Organizations.findOne({ _id: organizationId }),
    user: Meteor.user(),
    loading: !handle.ready()
  }
}, Page)
