import { getContacts } from '../../../src/server/api/assignment'
import { Organization, Assignment, Campaign } from '../../../src/server/models'

jest.mock('../../../src/lib/timezones.js')
var timezones = require('../../../src/lib/timezones.js')

describe('test getContacts builds queries correctly', () => {
  var organization = new Organization({
    texting_hours_enforced: false,
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

  it('works with: no contacts filter', () => {
    const query = getContacts(assignment, undefined, organization, campaign)
  }) // it
}) // describe

// select * from "campaign_contact" where "assignment_id" = 1

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
    var query = getContacts(assignment, { validTimezone: true }, organization, campaign)
    expect(query.toString()).toMatch(
      /^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-5_1\', \'\'\).*/
    )
  }) // it

  it('returns the correct query -- in default texting hours, with valid_timezone == false', () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(true)
    var query = getContacts(assignment, { validTimezone: false }, organization, campaign)
    expect(query.toString()).toMatch(
      /^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-4_1\'\).*/
    )
  }) // it

  it('returns the correct query -- NOT in default texting hours, with valid_timezone == true', () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(false)
    var query = getContacts(assignment, { validTimezone: true }, organization, campaign)
    expect(query.toString()).toMatch(
      /^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-5_1\'\).*/
    )
  }) // it

  it('returns the correct query -- NOT in default texting hours, with valid_timezone == false', () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(false)
    var query = getContacts(assignment, { validTimezone: false }, organization, campaign)
    expect(query.toString()).toMatch(
      /^select \* from \"campaign_contact\" where \"assignment_id\" = 1 and \"timezone_offset\" in \(\'-4_1\', \'\'\).*/
    )
  }) // it

  it('returns the correct query -- no contacts filter', () => {
    var query = getContacts(assignment, null, organization, campaign)
    expect(query.toString()).toMatch(
      /^select \* from \"campaign_contact\" where \"assignment_id\" = 1.*/
    )
  }) // it

  it('returns the correct query -- no validTimezone property in contacts filter', () => {
    var query = getContacts(assignment, {}, organization, campaign)
    expect(query.toString()).toMatch(
      /^select \* from \"campaign_contact\" where \"assignment_id\" = 1.*/
    )
  }) // it

  it('returns the correct query -- validTimezone property is null', () => {
    var query = getContacts(assignment, { validTimezone: null }, organization, campaign)
    expect(query.toString()).toMatch(
      /^select \* from \"campaign_contact\" where \"assignment_id\" = 1.*/
    )
  }) // it
}) // describe
