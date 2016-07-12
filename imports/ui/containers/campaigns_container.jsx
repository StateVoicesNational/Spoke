import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { createContainer } from 'meteor/react-meteor-data'
import { CampaignsPage } from '../pages/campaigns_page'
import { moment } from 'meteor/momentjs:moment'


export default createContainer(({organizationId}) => {
  const handle = Meteor.subscribe('campaigns', organizationId)

  let today = new Date()
  // UTC
  today = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  let campaigns = Campaigns.find({ organizationId }, { sort: { dueBy: 1}}).fetch()
  // campaigns = _.groupBy(campaigns, (campaign) => moment(campaign.dueBy).diff(moment(today)))

  return {
    organizationId,
    campaigns,
    loading: !handle.ready()
  }
}, CampaignsPage)
