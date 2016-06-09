import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { AppNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { OptOuts } from '../../api/opt_outs/opt_outs'
import { Campaigns } from '../../api/campaigns/campaigns'
import { displayName } from '../../api/users/users'
import { MessageForm } from '../../ui/components/message_form'
import { MessagesList } from '../../ui/components/messages_list'
import { ContactToolbar } from '../../ui/components/contact_toolbar'

const Page = ({ loading, messages, campaignContact, organizationId }) => (
  <AppPage
    navigation={loading ? '' :
      <AppNavigation
        organizationId={organizationId}
        title={displayName(campaignContact)}
        backToSection='messages'
      />
    }
    content={loading ? '' :
    <div>
      <ContactToolbar
        campaignContact={campaignContact}
      />
      <MessagesList contact={campaignContact} messages={messages} />
      <MessageForm
        campaignContact={campaignContact}
        initialScript=""
      />
    </div>
    }
    loading={loading}
  />
)

export const MessagePage = createContainer(({ organizationId, campaignContactId }) => {
  const handle = Meteor.subscribe('messageThread', campaignContactId)
  const campaignContact = CampaignContacts.findOne({_id: campaignContactId})
  Campaigns.find({}).fetch()
  return {
    organizationId,
    campaignContact,
    messages: campaignContact ? campaignContact.messages().fetch() : [],
    loading: !handle.ready()
  }
}, Page)
