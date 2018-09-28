import questionResponseCache from '../src/server/models/cacheable_queries/question-response'
import { Organization, Campaign, InteractionStep, CampaignContact, QuestionResponse, r } from '../src/server/models'
import { setupTest, cleanupTest } from './test_helpers'


describe('Cached question responses', () => {
  beforeAll(async () => await setupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)
  afterAll(async () => await cleanupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

  const records = [
    { interaction_step_id: 1234, value: 'first response' },
    { interaction_step_id: 4312, value: 'second response' },
    { interaction_step_id: 4321, value: 'third response' },
    { interaction_step_id: 4321, value: 'fourth response' }
  ]

  let contact
  let knexSpy
  // redis is not being set-up properly, comment out for now
  // let redisSpy

  beforeEach(async () => {
    jest.clearAllMocks()

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

    contact = await new CampaignContact({
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

    knexSpy = jest.spyOn(r, 'knex')
  })

  it('sets up the db correctly', async () => {
    const results = await r.knex('question_response')
    .where('campaign_contact_id', contact.id)
    .select('value', 'interaction_step_id')
    expect(results).toHaveLength(4)
  })

  describe('Query', async () => {
    // skip
    xit('Queries redis when present and minimal obj is true', async () => {
      // B.1 Check for data returned from cache in case we use a test redis
      // instance or mock a response
      // B.?
      // B.?+1 Spy on r.redis, check for 2 calls
      // B.?+2 Spy on r.knex, check it wasn't called
    })

    it('Queries the db when minimal obj is false', async () => {
      const results = await questionResponseCache.query(contact.id, false)
      expect(knexSpy).toHaveBeenCalledTimes(1)
      expect(results).toHaveLength(4)
    })

    describe('Queries the db when redis is not present', async () => {
      it('When minimal obj is true', async () => {
        const results = await questionResponseCache.query(contact.id, true)
        expect(knexSpy).toHaveBeenCalledTimes(1)
        // see line 20 for comments, declare below knexSpy when ready
        // expect(redisSpy).toHaveBeenCalledTimes(1)
        expect(results).toHaveLength(4)
      })

      it('When minimal obj is false', async () => {
        const results = await questionResponseCache.query(contact.id, false)
        expect(knexSpy).toHaveBeenCalledTimes(1)
        // see line 20 for comments, declare below knexSpy when ready
        // expect(redisSpy).toHaveBeenCalledTimes(1)
        expect(results).toHaveLength(4)
      })
    })
  })

  describe('Clear query', async () => {
    xit()
    /*
    TODO:
      1. Two test cases w/o redis (A) and with redis (B)
        A.1 Spy on r.redis and make sure it is only called once (conditional check)
        B.1 Check for data returned from cache in case we use a test redis
        instance or mock a response
        B.?
        B.?+1 Spy on r.redis, check for 2 calls
    */
  })

  describe('Reload query', async () => {
    xit()
    /*
    TODO:
      1. Two test cases w/o redis (A) and with redis (B)
        A.1 Spy on r.redis and make sure it is only called once (conditional check)
        B.1 Change data and make call
        B.2 Check db for updated data
        B.3 Check for data returned from cache in case we use a test redis
          instance or mock a response
        B.?
        B.?+1 Spy on r.redis, check for 2 calls
        B.?+2 Spy on r.knex, check for 1 call
    */
  })
})
