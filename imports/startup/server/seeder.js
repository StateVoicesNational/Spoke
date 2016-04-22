import { Assignments } from '../../api/assignments/assignments.js'
import { Campaigns } from '../../api/campaigns/campaigns.js'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts.js'
import { CampaignSurveys } from '../../api/campaign_surveys/campaign_surveys.js'

import { Fake } from 'meteor/anti:fake'
import { Meteor } from 'meteor/meteor'
import { Factory } from 'meteor/dburles:factory'
import { _ } from 'meteor/underscore'

Meteor.startup(() => {

  const removeData = () => {
    Assignments.remove({})
    Campaigns.remove({})
    CampaignContacts.remove({})
    CampaignSurveys.remove({})
  }

  removeData()

  if (Assignments.find({}).count() === 0) {
    _(2).times(() => {
      const customFields = ['eventUrl']

      const newSurvey = (answerChildren) => {
        let script = Factory.tree('campaign_survey').script
        script += ' Let us know at <<eventUrl>>!'
        return Factory.create('campaign_survey', { script, answerChildren })
      }
      const childSurveys = _(3).range().map(() => newSurvey([]))

      const survey = newSurvey(childSurveys)

      const campaign = Factory.create('campaign', {
        customFields,
        campaignSurveyId: survey._id })

      const campaignId = campaign._id

      const assignment = Factory.create('assignment', {
        campaignId,
        campaign: {
          title: campaign.title,
          description: campaign.description,
          script: campaign.script,
          customFields: campaign.customFields
        }
      })
      const assignmentId = assignment._id

      _(10).times(() => {
        const eventUrl = `http://bit.ly/${Fake.word(8)}`
        Factory.create('campaign_contact', { assignmentId, campaignId, customFields: { eventUrl } })
      })
    })
  }
  //   _(2).times(() => {

  // }
})
