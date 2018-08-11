import {getTimezoneByZip} from '../../src/workers/jobs'
import {r, ZipCode} from '../../src/server/models'
import {setupTest, cleanupTest} from "../test_helpers";

jest.mock('../../src/lib/zip-format')
var zipFormat = require('../../src/lib/zip-format')

describe('test getTimezoneByZip', () => {

  beforeAll(async () => await setupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)
  afterAll(async () => await cleanupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

  it('returns timezone data from the common zipcode/timezone mappings', async () => {
    zipFormat.zipToTimeZone.mockReturnValueOnce([0, 0, 3, 1])

    var good_things_come_to_those_who_wait = await getTimezoneByZip('11790')
    expect(good_things_come_to_those_who_wait).toEqual('3_1')
  })

  it('does not memoize common zipcode/timezone mappings', async () => {
    zipFormat.zipToTimeZone.mockReturnValueOnce([0, 0, 4, 1])

    var future = await getTimezoneByZip('11790')
    expect(future).toEqual('4_1')
  })

  it('does not find a zipcode in the database!', async () => {
    zipFormat.zipToTimeZone.mockReturnValueOnce(undefined)

    var future = await getTimezoneByZip('11790')
    expect(future).toEqual('')
  })

  it('finds a zipcode in the database and memoizes it', async () => {
    zipFormat.zipToTimeZone.mockReturnValueOnce(undefined)

    try {
      var zipCode = new ZipCode({
        zip: '11790',
        city: 'Stony Brook',
        state: 'NY',
        timezone_offset: 7,
        has_dst: true,
        latitude: 0,
        longitude: 0
      })
      var future = await ZipCode.save(zipCode)
      expect(future).resolves

      future = await getTimezoneByZip('11790')
      expect(future).toEqual('7_1')

      future = await r.table('zip_code').getAll().delete()
      expect(future).resolves

      future = await r.table('zip_code').get('11790')
      expect(future).toEqual([])

      future = await getTimezoneByZip('11790')
      expect(future).toEqual('7_1')
    }
    finally {
      return await r.table('zip_code').getAll().delete()
    }


  })
})

// TODO
// 1. loadContacts with upload
// 2. loadContactsFromWarehouse (connect the db to the test db and use another campaign's contacts for input)
// 3. loadContactsFromWarehouse with > 10000 contacts for iteration
// 4. loadContactsFromWarehouse with > 10000 LIMIT clause which should error out and save job with error message
// 5. loadContactsFromWarehouse with = 30000 and check contact count
