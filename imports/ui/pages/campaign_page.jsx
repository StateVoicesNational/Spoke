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
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';

const styles = {
  stat: {
    margin: '10px 0'
  },
  count: {
    fontSize: '60px',
    paddingTop: '10px',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  title: {
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'gray'
  }
}
const Stat = ({ title, count }) => (
  <div className="col-xs-3">
    <Card
      key={title}
      style={styles.stat}
    >
      <CardTitle
        title={count}
        titleStyle={styles.count}
      />
      <CardText
        style={styles.title}
      >
        {title}
      </CardText>
    </Card>
  </div>
)
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
        { stats ? (
            <div className="row">
              <Stat title="Contacts" count={stats.contactCount} />
              <Stat title="Texters" count={assignments.length} />
              <Stat title="Messages sent" count={stats.messageSentCount} />
              <Stat title="Replies" count={stats.messageReceivedCount} />
            </div>
          ) : ''
        }
        <p>
        </p>
        <p>
          <Export campaign={campaign}/>
        </p>
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
