import React from 'react'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { CampaignForm } from '../components/campaign_form'
import { AppPage } from '../../ui/layouts/app_page'
import { AdminNavigation } from '../../ui/components/navigation'
import { createContainer } from 'meteor/react-meteor-data'
import { Roles } from 'meteor/alanning:roles'


const _CampaignEditPage = ({ organizationId, texters, campaign, loading }) => (
  <AppPage
    navigation={
      <AdminNavigation
        organizationId={organizationId}
        // title="Edit campaign"
        title={campaign ? campaign.title : ''}
        backToSection="campaigns"

      />
    }
    content={loading ? '' : (
      <CampaignForm
        organizationId={organizationId}
        texters={texters}
        campaign={campaign}
      />
    )}
    loading={loading}
  />
  )

export const CampaignEditPage = createContainer(({ campaignId, organizationId }) => {
  const handle = Meteor.subscribe('campaign.edit', campaignId, organizationId)
  // OptOuts.find( { organizationId }).fetch()
  return {
    organizationId,
    campaign: Campaigns.findOne({ _id: campaignId }),
    texters: Roles.getUsersInRole('texter', organizationId).fetch(),
    loading: !handle.ready()
  }
}, _CampaignEditPage)
