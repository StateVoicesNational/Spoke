import { Meteor } from 'meteor/meteor'
import { _ } from 'underscore'
import { Assignments } from '../../api/assignments/assignments.js'
import { Fake } from 'meteor/anti:fake'
import { Factory } from 'meteor/dburles:factory'

Meteor.startup(() => {
  if (Assignments.find({}).count() === 0) {
    _(2).times(() => {
      const customFields = ['event_url']

      let script = Factory.tree('campaign').script
      script += ' Let us know at <<event_url>>!'

      const campaign = Factory.create('campaign', {
        customFields,
        script })

      const campaignId = campaign._id

      const assignment = Factory.create('assignment', {
        campaignId,
        campaign: {
          title: campaign.title,
          description: campaign.description,
          script: campaign.script,
          customFields: campaign.custom_fields
        }
      })
      const assignmentId = assignment._id
      // Factory.create('campaign_contact',
      // {campaignId: campaign._id, assignmentId: assignment._id});
      _(10).times(() => {
        const url = `http://bit.ly/${Fake.word(8)}`
        Factory.create('campaign_contact',
          { assignmentId, campaignId, customFields: { event_url: url } })
      })
    })
  }
})
