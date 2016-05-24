import { Meteor } from 'meteor/meteor'
import { OptOuts } from '../opt_outs.js'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts.js'

Meteor.publishComposite('opt_outs', {
  find: function() {
    return OptOuts.find({})
  },
  children: [
    {
      find: (optOut) => CampaignContacts.find({
        _id: optOut.campaignContactId
      })
    }
  ]
})
