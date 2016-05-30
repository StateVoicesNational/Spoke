import { Meteor } from 'meteor/meteor'
import { Campaigns } from '../campaigns.js'
import { Messages } from '../../messages/messages.js'
import { CampaignContacts } from '../../campaign_contacts/campaign_contacts.js'
import { Assignments } from '../../assignments/assignments.js'
import { SurveyQuestions } from '../../survey_questions/survey_questions.js'
import { Roles } from 'meteor/alanning:roles'
// Standardize this
const adminCheck = (userId, organizationId) => (!!userId && Roles.userIsInRole(userId, 'admin', organizationId))

Meteor.publish('campaigns', function campaignsPublication(organizationId) {

  if (!adminCheck(this.userId, organizationId)) {
    return this.ready();
  }

  return Campaigns.find({ organizationId })
})

Meteor.publish('campaign.new', (organizationId) => Roles.getUsersInRole('texter', organizationId))

Meteor.publishComposite('campaign.edit', (campaignId, organizationId) => {
  return {
    find: () => Campaigns.find({ _id: campaignId }),
    children: [
      {
        // TODO: This isn't actually a child
        find: (campaign) => Roles.getUsersInRole('texter', organizationId)
      },
      {
        find: (campaign) => Assignments.find({ campaignId })
      },
      {
        find: (campaign) => SurveyQuestions.find( { campaignId })
      }
    ]
  }
})

Meteor.publish('campaign', function(campaignId) {
  const campaign = Campaigns.findOne({ _id: campaignId })
  const organizationId = campaign.organizationId
  if (!adminCheck(this.userId, organizationId)) {
    return this.ready()
  }

  return [
    Roles.getUsersInRole('texter', organizationId),
    Campaigns.find({ _id: campaignId }),
    Assignments.find({ campaignId }),
    CampaignContacts.find( { campaignId }, { fields: {}}),
    Messages.find()
  ]

  // return [
  //   {
  //     // TODO: This isn't actually a child
  //     find: (campaign) => Roles.getUsersInRole('texter', organizationId)
  //   },
  //   {
  //     find: () => Campaigns.find({ _id: campaignId }),
  //     children: [
  //       {
  //         find: (campaign) => Assignments.find({ campaignId })
  //       },
  //       {
  //         find: (campaign) => CampaignContacts.find( { campaignId }, { fields: {}}),
  //         children: [
  //           {
  //             find: (contact) => Messages.find({
  //               contactNumber: contact.cell,
  //               campaignId
  //             }, {
  //               limit: 1,
  //               sort: { createdAt: -1 }
  //             })
  //           }
  //         ]
  //       }
  //     ]
  //   }
  // ]
})

// Meteor.publishComposite('campaign', function(campaignId) {
//   const campaign = Campaigns.findOne({ _id: campaignId })
//   const organizationId = campaign.organizationId
//   if (!adminCheck(this.userId, organizationId)) {
//     return this.ready()
//   }

//   return [
//     {
//       // TODO: This isn't actually a child
//       find: (campaign) => Roles.getUsersInRole('texter', organizationId)
//     },
//     {
//       find: () => Campaigns.find({ _id: campaignId }),
//       children: [
//         {
//           find: (campaign) => Assignments.find({ campaignId })
//         },
//         {
//           find: (campaign) => CampaignContacts.find( { campaignId }, { fields: {}}),
//           children: [
//             {
//               find: (contact) => Messages.find({
//                 contactNumber: contact.cell,
//                 campaignId
//               }, {
//                 limit: 1,
//                 sort: { createdAt: -1 }
//               })
//             }
//           ]
//         }
//       ]
//     }
//   ]
// })