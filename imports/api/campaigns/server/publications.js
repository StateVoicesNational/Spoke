import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../campaigns.js'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts.js'
import { Roles } from 'meteor/alanning:roles'
// Standardize this
const adminCheck = (userId, organizationId) => (!!userId && Roles.userIsInRole(userId, 'admin', organizationId))

Meteor.publish('campaigns', function campaignsPublication(organizationId) {
  if (!adminCheck(this.userId, organizationId)) {
    return this.ready();
  }

  return [
    Campaigns.find({ organizationId }),
    Roles.getUsersInRole('texter', organizationId)
  ];
})

Meteor.publish('campaign.overview', function campaignOverviewPublication(campaignId) {
  const campaign = Campaigns.findOne({ _id: campaignId })
  if (!adminCheck(this.userId, campaign.organizationId)) {
    return this.ready();
  }

  return [
    Campaigns.find({ _id: campaignId }),
    CampaignContacts.find( { campaignId }, {fields: {}})
  ]
})


