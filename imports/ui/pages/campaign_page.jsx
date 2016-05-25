import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { BackNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { OptOuts } from '../../api/opt_outs/opt_outs'
import { Campaigns } from '../../api/campaigns/campaigns'
import { displayName } from '../../api/users/users'
import { MessageForm } from '../../ui/components/message_form'
import { ContactToolbar } from '../../ui/components/contact_toolbar'

const Page = ({ loading, organizationId, campaign, contacts }) => (
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
      Campaign has {contacts.length} contacts.
    </div>
    }
    loading={loading}
  />
)

export const CampaignPage = createContainer(({ organizationId, campaignId }) => {
  const handle = Meteor.subscribe('campaign.overview', campaignId)

  const campaign = Campaigns.findOne({_id: campaignId})
  const contacts = CampaignContacts.find({ campaignId }).fetch()

  return {
    campaign,
    contacts,
    loading: !handle.ready()
  }
}, Page)
