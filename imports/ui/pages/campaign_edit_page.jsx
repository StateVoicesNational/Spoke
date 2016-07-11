import React from 'react'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { Assignments } from '../../api/assignments/assignments.js'
import { Scripts } from '../../api/scripts/scripts.js'
import { InteractionSteps } from '../../api/interaction_steps/interaction_steps.js'
import { CampaignForm } from '../components/campaign_form'
import { AppPage } from '../../ui/layouts/app_page'
import { AdminNavigation } from '../../ui/components/navigation'
import { createContainer } from 'meteor/react-meteor-data'
import { Roles } from 'meteor/alanning:roles'


const _CampaignEditPage = ({ organizationId, texters, assignedTexters, scripts, interactionSteps, campaign, loading }) => (
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
        interactionSteps={interactionSteps}
        scripts={scripts}
        assignedTexters={assignedTexters}
      />
    )}
    loading={loading}
  />
  )

export const CampaignEditPage = createContainer(({ campaignId, organizationId }) => {
  const handle = Meteor.subscribe('campaign.edit', campaignId, organizationId)

  const scripts = Scripts.find( { campaignId }).fetch()
  const interactionSteps = InteractionSteps.find( { campaignId }).fetch()
  const campaign = Campaigns.findOne({ _id: campaignId })
  const texters = Roles.getUsersInRole('texter', organizationId).fetch()
  const assignedTexters = campaign ? Assignments.find({ campaignId }).fetch().map(({ userId }) => userId) : texters.map((texter) => texter._id)

  // OptOuts.find( { organizationId }).fetch()
  return {
    organizationId,
    interactionSteps,
    scripts,
    campaign,
    assignedTexters,
    texters,
    loading: !handle.ready()
  }
}, _CampaignEditPage)
