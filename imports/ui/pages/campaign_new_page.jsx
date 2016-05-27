import React from 'react'
import { CampaignForm } from '../components/campaign_form'
import { AppPage } from '../../ui/layouts/app_page'
import { BackNavigation } from '../../ui/components/navigation'
import { createContainer } from 'meteor/react-meteor-data'
import  TextField from 'material-ui/TextField'
import { FlowRouter } from 'meteor/kadira:flow-router'

export const Page = ({ organizationId, texters, loading }) => (
  <AppPage
    navigation={
      <BackNavigation
        organizationId={organizationId}
        title="Create new campaign"
        backToSection="campaigns"
      />
    }
    content={ texters.length === 0 ? (
        <div>
          <p>You're almost ready to start creating campaigns, but first you need some texters. Here's your link to share:</p>
          <TextField
            fullWidth
            value={`${Meteor.absoluteUrl()}${FlowRouter.path('texterSignup', { organizationId })}`}
          />
        </div>
      ) : (
        <CampaignForm
          organizationId={organizationId}
          texters={texters}
        />
    )}
    loading={loading}
  />
)

export const CampaignNewPage = createContainer(({ organizationId }) => {
 const handle = Meteor.subscribe('campaign.new', organizationId)
  const texters = Roles.getUsersInRole('texter', organizationId).fetch()
  console.log(texters)
  return {
    organizationId,
    texters,
    loading: !handle.ready()
  }
}, Page)
