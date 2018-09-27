import questionResponseCache from '../src/server/models/cacheable_queries/question-response'
import { Organization, Campaign, InteractionStep, CampaignContact, QuestionResponse, r } from '../src/server/models'
import { getContext, setupTest, cleanupTest } from './test_helpers'

const campaignContactId = 2147483647

describe('Cached question responses', () => {
  beforeAll(async () => await setupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)
  afterAll(async () => await cleanupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

  describe('With an existing cache', () => {
    const records = [
      { interaction_step_id: 1234, value: 'first response' },
      { interaction_step_id: 4312, value: 'second response' },
      { interaction_step_id: 4321, value: 'third response' },
      { interaction_step_id: 4321, value: 'fourth response' }
    ]

    beforeEach(async () => {
      const organization = await (new Organization({
        name: 'organization',
        texting_hours_start: 0,
        texting_hours_end: 0
      })).save()

      const campaign = await (new Campaign({
        organization_id: organization.id,
        is_started: false,
        is_archived: false,
        due_by: new Date()
      })).save()

      const interactionStep = await new InteractionStep({
        campaign_id: campaign.id
      }).save()

      const contact = await new CampaignContact({
        first_name: 'Ann',
        last_name: 'Lewis',
        cell: '5555555555',
        zip: '12345',
        campaign_id: campaign.id
      }).save()

      const questionReponses = await Promise.all([
        ...records.map(row => (
          new QuestionResponse({
            campaign_contact_id: contact.id,
            interaction_step_id: interactionStep.id,
            value: row.value
          })
        ))
      ].map(async each => (
        each.save()
      )))
    })

    it('finds records in the database', async () => {
      const results = await r.knex('question_response')
        .select('value', 'interaction_step_id')
      expect(results).toHaveLength(4)
    })
  })
})
