import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { AdminNavigation } from '../../ui/components/navigation'
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
import { Export } from '../../ui/components/export'

const Page = ({ loading, organizationId, campaign, contacts, assignments }) => {
  const unmessagedContacts = contacts.filter((contact) => !contact.lastMessage())
  const messagedContacts = contacts.filter((contact) => !!contact.lastMessage())
  const unrespondedContacts = contacts.filter((contact) => {
    const lastMessage = contact.lastMessage()
    return (!!lastMessage && lastMessage.isFromContact)
  })

  return (
    <AppPage
      navigation={loading ? '' :
        <AdminNavigation
          organizationId={organizationId}
          title={campaign.title}
          backToSection='campaigns'
        />
      }
      content={loading ? '' :
      <div>
        <p>
          Total contacts: {contacts.length} contacts.
        </p>
        <p>
          Contacts who got a first message: { messagedContacts.length }
        </p>
        <p>
          Assigned texters: { assignments.length }
        </p>
        <RaisedButton
          label="Edit"
          onTouchTap={() => FlowRouter.go('campaign.edit', { campaignId: campaign._id, organizationId })}
        />
        <Export campaign={campaign}/>
      </div>
      }
      loading={loading}
    />
  )
}

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
