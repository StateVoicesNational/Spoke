import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

import { CampaignContacts } from '../campaign_contacts.js'
import { Assignments } from '../../assignments/assignments.js'
Meteor.publish('campaignContacts.forAssignment', (assignmentId) => {
  new SimpleSchema({
    assignmentId: { type: String },
  }).validate({ assignmentId })

  return [
    Assignments.find({ _id: assignmentId }),
    CampaignContacts.find({ assignmentId })
  ]
})
