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
    Messages.find()
  ]
})

// server: publish the current size of a collection
Meteor.publish("campaign.stats", function(campaignId) {
  console.log("publishing?")
  let contactCount = 0
  let messageSentCount = 0
  let messageReceivedCount = 0
  let initializing = true

  const contactCountHandle = CampaignContacts.find({ campaignId }).observeChanges({
    added: () => {
      contactCount++
      console.log("campaigncontacts added?")
      if (!initializing) {
        this.changed('campaignStats', campaignId, { contactCount })
      }
    },
    removed: () => {
      contactCount--
      this.changed('campaignStats', campaignId, { contactCount })
    }
  })

  const messageSentCountHandle = Messages.find({ campaignId, isFromContact: false }).observeChanges({
    added: () => {
      messageSentCount++
      if (!initializing) {
        this.changed('campaignStats', campaignId, { messageSentCount })
      }
    },
    removed: () => {
      messageSentCount--
      this.changed('campaignStats', campaignId, { messageSentCount })
    }
  })

  const messageReceivedCountHandle = Messages.find({ campaignId, isFromContact: true }).observeChanges({
    added: () => {
      messageReceivedCount++
      if (!initializing) {
        this.changed('campaignStats', campaignId, { messageReceivedCount })
      }
    },
    removed: () => {
      messageReceivedCount--
      this.changed('campaignStats', campaignId, { messageReceivedCount })
    }
  })

  initializing = false

  this.added('campaignStats', campaignId, { contactCount, messageSentCount, messageReceivedCount })
  this.ready()

  this.onStop(() => {
    contactCountHandle.stop()
    messageSentCountHandle.stop()
    messageReceivedCountHandle.stop()
  })
})