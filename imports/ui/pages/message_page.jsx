import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { BackNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { displayName } from '../../api/users/users'
import { MessageForm } from '../../ui/components/message_form'
import { ContactToolbar } from '../../ui/components/contact_toolbar'

const Page = ({ loading, messages, campaignContact, organizationId }) => (
  <AppPage
    navigation={loading ? '' :
      <BackNavigation
        organizationId={organizationId}
        title={displayName(campaignContact)}
        backToSection='messages'
      />
    }
    content={loading ? '' :
      <MessageForm
        campaignContact={campaignContact}
        initialScript=""
      />
    }
    loading={loading}
  />
)

export const MessagePage = createContainer(({ organizationId, campaignContactId }) => {
  const handle = Meteor.subscribe('messageThread', campaignContactId)
  const campaignContact = CampaignContacts.findOne({_id: campaignContactId})
  return {
    organizationId,
    campaignContact,
    messages: campaignContact ? campaignContact.messages().fetch() : [],
    loading: !handle.ready()
  }
}, Page)
