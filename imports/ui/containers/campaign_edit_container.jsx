import { createContainer } from 'meteor/react-meteor-data'
import { CampaignEditPage } from '../pages/campaign_edit_page'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'

export default createContainer(({ organizationId }) => {
    const handle = Meteor.subscribe('campaigns', organizationId)

  // TODO get actual edit form
  console.log("here!")

  return {
    organizationId,
    texters: Roles.getUsersInRole('texter', organizationId).fetch(),
    loading: !handle.ready()
  }
}, CampaignEditPage)

