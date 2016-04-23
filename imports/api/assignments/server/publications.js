import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Assignments } from '../assignments.js'
import { Campaigns } from '../../campaigns/campaigns'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts'
import { CampaignSurveys } from '../../campaign_surveys/campaign_surveys'

Meteor.publish('assignments', () =>
  // TODO: actually filter correctly and return public fields only
  Assignments.find({})
)

Meteor.publishComposite('assignment.allRelatedData', (assignmentId) => {
  new SimpleSchema({
    assignmentId: { type: String }
  }).validate({ assignmentId })

// TODO I actually don't think we need reactivity here.
  return {
    find: () => Assignments.find({ _id: assignmentId }),
    children: [
      {
        find: (assignment) => Campaigns.find({ _id: assignment.campaignId }),
        children: [
          {
            find: (campaign) => CampaignSurveys.find({ campaignId: campaign._id })
          }
        ]
      },
      {
        find: (assignment) => CampaignContacts.find({ assignmentId: assignment._id })
      }

    ]
  }
})

