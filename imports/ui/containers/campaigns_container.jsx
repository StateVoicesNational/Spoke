import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { createContainer } from 'meteor/react-meteor-data'
import { CampaignsPage } from '../pages/campaigns_page'


export default createContainer(({organizationId}) => {
  const handle = Meteor.subscribe('campaigns', organizationId)

  let today = new Date()
  // UTC
  today = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  const campaigns = Campaigns.find({ organizationId }).fetch()

  return {
    organizationId,
    campaigns,
    loading: !handle.ready()
  }
}, CampaignsPage)
