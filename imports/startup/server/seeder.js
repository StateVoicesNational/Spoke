import { CampaignContacts }  from '../../api/campaign_contacts/campaign_contacts.js';
import { Assignments }  from '../../api/assignments/assignments.js';
import { Campaigns }  from '../../api/campaigns/campaigns.js';
import { Fake } from 'meteor/anti:fake';

Meteor.startup(function() {
  if (Assignments.find({}).count() === 0) {
    _(2).times(function(b) {
      let custom_fields = ['event_url']

      script = Factory.tree('campaign').script
      script += ' Let us know at <<event_url>>!'

      let campaign = Factory.create('campaign', {
        custom_fields,
        script})

      campaignId = campaign._id

      let assignment = Factory.create('assignment', {
        campaignId,
        campaign: {
          title: campaign.title,
          description: campaign.description,
          script: campaign.script,
          custom_fields: campaign.custom_fields
        }
      })
      let assignmentId = assignment._id
      // Factory.create('campaign_contact', {campaignId: campaign._id, assignmentId: assignment._id});
      _(10).times(function(n) {
        let url = 'http://bit.ly/' + Fake.word(8)
        Factory.create('campaign_contact', {assignmentId, campaignId, custom_fields: {'event_url': url}})
      });

    })
  }
});