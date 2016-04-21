import { CampaignContacts }  from '../../api/campaign_contacts/campaign_contacts.js';
import { Assignments }  from '../../api/assignments/assignments.js';
import { Campaigns }  from '../../api/campaigns/campaigns.js';
import { Fake } from 'meteor/anti:fake';

Meteor.startup(function() {
  if (Assignments.find({}).count() === 0) {
    _(2).times(function(b) {
      let custom_fields = ['event_url']
      let script = "Hey there, <<name>>! We have an event coming up soon! If you think you can make it, let us know at <<event_url>>"

      let campaign = Factory.create('campaign', {
        custom_fields,
        script})

      campaignId = campaign._id

      let assignment = Factory.create('assignment', {campaignId})
      let assignmentId = assignment._id
      // Factory.create('campaign_contact', {campaignId: campaign._id, assignmentId: assignment._id});
      _(10).times(function(n) {
        Factory.create('campaign_contact', {assignmentId, campaignId})
      });

    })
  }
});