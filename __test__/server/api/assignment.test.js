import {graphql} from 'graphql'
import {getContacts} from '../../../src/server/api/assignment'
import {Assignment, Campaign, Organization} from '../../../src/server/models'
import {cleanupTest, setupTest} from '../../test_helpers'
import {
  createUser,
  createOrganization,
  createInvite,
  createCampaign,
  createUserOrganization,
  createAssignment,
  getContext,
  makeExecutableSchema
} from '../test_helpers'

jest.mock('../../../src/lib/timezones.js')
var timezones = require('../../../src/lib/timezones.js')

beforeAll(async () => await setupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)
afterAll(async () => await cleanupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

describe('test assignment query', async () => {
  it('works', async () => {
    const testAdminUser = await createUser()
    expect(testAdminUser.id).toBeDefined()
    const invite = await createInvite()
    expect(invite.data.createInvite).toBeDefined()
    const organization = await createOrganization(testAdminUser, 'Impeachment', testAdminUser.id, invite.data.createInvite.id)
    const campaign = await createCampaign(testAdminUser, 'Impeachment', 'Impeachment', organization.data.createOrganization.id)
    let _ = await createUserOrganization(testAdminUser.id, organization.data.createOrganization.id, 'TEXTER')
    const assignment = await createAssignment(testAdminUser.id, campaign.data.createCampaign.id, 1000)

    const query = `
    query Q($id:String!) {
      assignment(id: $id) {
        id
        campaign {
          id
        }
      }
    }
   `

    const rootValue = {}
    const executableSchema = makeExecutableSchema()
    const context = getContext({user: testAdminUser})
    const result = await graphql(executableSchema, query, rootValue, context, {id: assignment.id})
    const {data} = result
    expect(data.assignment.id).toBe(assignment.id.toString())
    expect(data.assignment.campaign.id).toBe(campaign.data.createCampaign.id.toString())
  })
})


describe('test getContacts timezone stuff only', () => {
  var organization = new Organization({
    texting_hours_enforced: true,
    texting_hours_start: 9,
    texting_hours_end: 14
  })

  var campaign = new Campaign({
    due_by: new Date()
  })

  var assignment = new Assignment({
    id: 1
  })

  beforeEach(() => {
    timezones.getOffsets.mockReturnValueOnce([['-5_1'], ['-4_1']])
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('returns the correct query -- in default texting hours, with valid_timezone == true', () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(true)
    var query = getContacts(assignment, {validTimezone: true}, organization, campaign)
    expect(query.toString()).toMatch(/^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-5_1\', \'\'\).*/)
  }) // it

  it('returns the correct query -- in default texting hours, with valid_timezone == false', () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(true)
    var query = getContacts(assignment, {validTimezone: false}, organization, campaign)
    expect(query.toString()).toMatch(/^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-4_1\'\).*/)
  }) // it

  it('returns the correct query -- NOT in default texting hours, with valid_timezone == true', () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(false)
    var query = getContacts(assignment, {validTimezone: true}, organization, campaign)
    expect(query.toString()).toMatch(/^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-5_1\'\).*/)
  }) // it

  it('returns the correct query -- NOT in default texting hours, with valid_timezone == false', () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(false)
    var query = getContacts(assignment, {validTimezone: false}, organization, campaign)
    expect(query.toString()).toMatch(/^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-4_1\', \'\'\).*/)
  }) // it

  it('returns the correct query -- no contacts filter', () => {
    var query = getContacts(assignment, null, organization, campaign)
    expect(query.toString()).toMatch(/^select \* from \"campaign_contact\" where \"assignment_id\" = 1.*/)
  }) // it

  it('returns the correct query -- no validTimezone property in contacts filter', () => {
    var query = getContacts(assignment, {}, organization, campaign)
    expect(query.toString()).toMatch(/^select \* from \"campaign_contact\" where \"assignment_id\" = 1.*/)
  }) // it

  it('returns the correct query -- validTimezone property is null', () => {
    var query = getContacts(assignment, {validTimezone: null}, organization, campaign)
    expect(query.toString()).toMatch(/^select \* from \"campaign_contact\" where \"assignment_id\" = 1.*/)
  }) // it
}) // describe
