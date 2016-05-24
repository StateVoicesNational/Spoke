import { Meteor } from 'meteor/meteor'
import { Messages } from '../messages'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts'
import { Campaigns } from '../../campaigns/campaigns'
import { OptOuts } from '../../opt_outs/opt_outs'

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


Meteor.publishComposite('messageThread', function (campaignContactId) {
  return {
    find: function() {
      return CampaignContacts.find({ _id: campaignContactId })
    },
    children: [
      {
        find: (contact) => contact.messages()
      },
      {
        // this is just for the optouts. should cache organization id
        find: function(contact) {
          console.log("found contact", contact)
          return Campaigns.find({_id: contact.campaignId})
        },
        children: [
          {
            find: function(campaign) {
              console.log("found campaign", campaign)
              return OptOuts.find({organizationId: campaign.organizationId})
            }
          }

        ]
      },
    ]
  }
})
