import { Meteor } from 'meteor/meteor'
import { Messages } from '../messages'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts'

Meteor.publishComposite('messages', {
  find: function() {
    return Messages.find({ userId: this.userId })
  },
  children: [
    {
      find: (message) => CampaignContacts.find({
        campaignId: message.campaignId,
        cell: message.contactNumber
      }, {
        fields: { cell: 1, campaignId: 1, firstName: 1, lastName: 1}
      })
    }
  ]
})
