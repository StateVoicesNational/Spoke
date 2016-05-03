import { Meteor } from 'meteor/meteor'

import { Campaigns } from '../campaigns.js'

Meteor.publish('campaigns', function campaignsPublication() {
  return Campaigns.find({});
});
