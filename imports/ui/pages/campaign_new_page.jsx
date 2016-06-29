import React from 'react'
import { CampaignForm } from '../components/campaign_form'
import { AppPage } from '../../ui/layouts/app_page'
import { AdminNavigation } from '../../ui/components/navigation'
import { createContainer } from 'meteor/react-meteor-data'
import  TextField from 'material-ui/TextField'
import { FlowRouter } from 'meteor/kadira:flow-router'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import { OptOuts } from '../../api/opt_outs/opt_outs'
class _CampaignNewPage extends React.Component {
  render () {
    const { organizationId, texters, loading } = this.props
    return (
      <AppPage
        navigation={
          <AdminNavigation
            title="Create new campaign"
            organizationId={organizationId}
            backToSection="campaigns"
            hideSidebar
          />
        }
        content={(
            <CampaignForm
              organizationId={organizationId}
              texters={texters}
            />
        )}
        hideSidebar
        loading={loading}
      />
    )
  }
}

export const CampaignNewPage = createContainer(({ organizationId }) => {
 const handle = Meteor.subscribe('campaign.new', organizationId)
  const texters = Roles.getUsersInRole('texter', organizationId).fetch()
  // OptOuts.find({organizationId}).fetch()
  return {
    organizationId,
    texters,
    loading: !handle.ready()
  }
}, _CampaignNewPage)
