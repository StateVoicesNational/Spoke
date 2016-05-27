import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { BackNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { Assignments } from '../../api/assignments/assignments'
import { OptOuts } from '../../api/opt_outs/opt_outs'
import { Campaigns } from '../../api/campaigns/campaigns'
import { displayName } from '../../api/users/users'
import { MessageForm } from '../../ui/components/message_form'
import { ContactToolbar } from '../../ui/components/contact_toolbar'
import { FlowRouter } from 'meteor/kadira:flow-router'
import RaisedButton from 'material-ui/RaisedButton'

const Page = ({ loading, organizationId, campaign, contacts, assignments }) => (
  <AppPage
    navigation={loading ? '' :
      <BackNavigation
        organizationId={organizationId}
        title={campaign.title}
        backToSection='campaigns'
      />
    }
    content={loading ? '' :
    <div>
      <p>
        Campaign has {contacts.length} contacts.
      </p>
      <RaisedButton
        label="Edit"
        onTouchTap={() => FlowRouter.go('campaign.edit', { campaignId: campaign._id, organizationId })}
      />
      Assigned texters: { assignments.length }
    </div>
    }
    loading={loading}
  />
)

export const CampaignPage = createContainer(({ organizationId, campaignId }) => {
  const handle = Meteor.subscribe('campaign', campaignId)

  const campaign = Campaigns.findOne({_id: campaignId})
  const contacts = CampaignContacts.find({ campaignId }).fetch()
  const assignments = Assignments.find({ campaignId }).fetch()
  return {
    campaign,
    contacts,
    assignments,
    loading: !handle.ready()
  }
}, Page)
