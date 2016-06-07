import React from 'react'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { FlowRouter } from 'meteor/kadira:flow-router'

class _AppDashboardPage extends React.Component {
  componentWillReceiveProps({ organizationId, organizations, loading }) {
    // redirect / to a list once lists are ready
    if (!organizationId && !loading) {
      if (organizations.length > 0 ) {
        const organization = organizations[0]
        FlowRouter.go('todos', { organizationId: organization._id })
      }
    } else {
      FlowRouter.go('todos', { organizationId })
    }
  }

  render() {
    return null
  }
}
export const AppDashboardPage = createContainer(({ organizationId, organizations, loading }) => {
  const handle = Meteor.subscribe('organizations')
  return {
    organizationId,
    organizations,
    loading: !handle.ready() && loading // global layouts loading
  }
}, _AppDashboardPage)

