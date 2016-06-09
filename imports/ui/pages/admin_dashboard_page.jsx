import React from 'react'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { AdminNavigation } from '../../ui/components/navigation'
import { Dashboard } from '../../ui/components/dashboard'
import { AppPage } from '../../ui/layouts/app_page'
import { Campaigns } from '../../api/campaigns/campaigns'
import { Organizations } from '../../api/organizations/organizations'
import { FlowRouter } from 'meteor/kadira:flow-router'
import FlatButton from 'material-ui/FlatButton'

class Page extends React.Component {
  componentWillReceiveProps({ organizationId, organizations, loading }) {
    // redirect / to a list once lists are ready
    if (!organizationId && !loading) {
      if (organizations.length > 0 ) {
        const organization = organizations[0]
        FlowRouter.go('campaigns', { organizationId: organization._id })
      }
    } else {
      FlowRouter.go('campaigns', { organizationId })
    }
  }

  render() {
    const { organizationId, campaigns, loading } = this.props
    const stats = [
      ['Campaigns', campaigns.length]
    ]
    return (
      <AppPage
        navigation={
          <AdminNavigation
            organizationId={organizationId}
          />
        }
        loading={loading}
      />
    )
  }
}
export const AdminDashboardPage = createContainer(({ organizationId, organizations, loading }) => {
  const handle = Meteor.subscribe('campaigns', organizationId)
  return {
    organizationId,
    organizations,
    // TODO: Route to an organization ID better
    campaigns: Campaigns.find({ organizationId }).fetch(),
    loading: !handle.ready() && loading // global layouts loading
  }
}, Page)

