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
import { Chart } from '../../ui/components/chart'

const _CampaignPage = ({ loading, organizationId, campaign, stats, assignments }) => {
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
          { stats ? (
              <div>
                Total contacts: {stats.contactCount}
                Messages: {stats.messageCount}
                <Chart />
              </div>
            ) : ''
          }
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

CampaignStats = new Mongo.Collection("campaignStats");

export const CampaignPage = createContainer(({ organizationId, campaignId }) => {
  const handle = Meteor.subscribe('campaign', campaignId)
  Meteor.subscribe('campaign.stats', campaignId)


  const campaign = Campaigns.findOne({_id: campaignId})
  const assignments = Assignments.find({ campaignId }).fetch()
  const stats = CampaignStats.findOne(campaignId)
  console.log("stats", stats)
  return {
    campaign,
    assignments,
    stats,
    loading: !handle.ready()
  }
}, _CampaignPage)
