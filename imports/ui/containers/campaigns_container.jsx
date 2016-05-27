import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { createContainer } from 'meteor/react-meteor-data'
import { CampaignsPage } from '../pages/campaigns_page'


export default createContainer(({organizationId}) => {
  const handle = Meteor.subscribe('campaign.list', organizationId)

  let today = new Date()
  // UTC
  today = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  const ongoingCampaigns = Campaigns.find({ dueBy: { $gte: today } }).fetch()
  const pastCampaigns = Campaigns.find({ dueBy: { $lt: today } }).fetch()

  return {
    organizationId,
    pastCampaigns,
    ongoingCampaigns,
    loading: !handle.ready()
  }
}, CampaignsPage)
