import {assignTexters} from '../../src/workers/jobs'
import {r, Campaign, CampaignContact, JobRequest, Organization, User, ZipCode} from '../../src/server/models'
import {setupTest, cleanupTest} from "../test_helpers";

describe('test texter assignment in dynamic mode', () => {
  
  beforeAll(async () => await setupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)
  afterAll(async () => await cleanupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

  const organization = Organization.save({
    id: '1',
    texting_hours_enforced: false,
    texting_hours_start: 9,
    texting_hours_end: 14
  })

  const campaign = Campaign.save({
    organization_id: organization.id,
    id: '1',
    use_dynamic_assignment: true
  })

  const contactInfo = ['1111111111','2222222222','3333333333','4444444444','5555555555']
  contactInfo.map((contact) => {
    CampaignContact.save({cell: contact, campaign_id: campaign.id})
  })

  const texterInfo = [
    {
      id: '1',
      auth0_id: 'aaa',
      first_name: 'Ruth',
      last_name: 'Bader',
      cell: '9999999999',
      email: 'rbg@example.com',
    },
    {
      id: '2',
      auth0_id: 'bbb',
      first_name: 'Elena',
      last_name: 'Kagan', 
      cell: '8888888888',
      email: 'ek@example.com'
    }
  ]
  texterInfo.map((texter) => {
    User.save({
      id: texter.id,
      auth0_id: texter.auth0_id,
      first_name: texter.first_name,
      last_name: texter.last_name,
      cell: texter.cell,
      email: texter.email
    })
  })

  it('assigns no contacts to texters with maxContacts set to 0', async() => {
    const organization = await Organization.save({
      id: '7777777',
      texting_hours_enforced: false,
      texting_hours_start: 9,
      texting_hours_end: 14, 
      name: 'Test Organization'
    })

    const campaign = await Campaign.save({
      organization_id: organization.id,
      id: '7777777',
      use_dynamic_assignment: true
    })

    const contactInfo = ['1111111111','2222222222','3333333333','4444444444','5555555555']
    contactInfo.map((contact) => {
      CampaignContact.save({cell: contact, campaign_id: campaign.id})
    })

    const texterInfo = [
      {
        id: '1',
        auth0_id: 'aaa',
        first_name: 'Ruth',
        last_name: 'Bader',
        cell: '9999999999',
        email: 'rbg@example.com',
      },
      {
        id: '2',
        auth0_id: 'bbb',
        first_name: 'Elena',
        last_name: 'Kagan', 
        cell: '8888888888',
        email: 'ek@example.com'
      }
    ]
    texterInfo.map(async(texter) => {
      await User.save({
        id: texter.id,
        auth0_id: texter.auth0_id,
        first_name: texter.first_name,
        last_name: texter.last_name,
        cell: texter.cell,
        email: texter.email
      })
    })
    const payload = '{"id": "3","texters":[{"id":"1","needsMessageCount":0,"maxContacts":0,"contactsCount":0},{"id":"2","needsMessageCount":0,"maxContacts":0,"contactsCount":0}]}'
    const job = await JobRequest.save({
      campaign_id: campaign.id,
      payload: payload,
      queue_name: "3:edit_campaign",
      job_type: 'assign_texters', 
    })
    await assignTexters(job)
    const result = await r.knex('campaign_contact')
      .where({campaign_id: campaign.id})
      .whereNotNull('assignment_id')
      .count()
    const assignedTextersCount = result[0]["count"]
    expect(assignedTextersCount).toEqual("0")
  })

})