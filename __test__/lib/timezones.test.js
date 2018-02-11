import {
  convertOffsetsToStrings,
  defaultTimezoneIsBetweenTextingHours,
  getLocalTime,
  getOffsets,
  isBetweenTextingHours,
} from '../../src/lib/index'
import sinon from 'sinon'

const makeConfig = (textingHoursStart, textingHoursEnd, textingHoursEnforced) => {
  return {
    textingHoursStart,
    textingHoursEnd,
    textingHoursEnforced
  }
}

jest.unmock('../../src/lib/timezones')
jest.mock('../../src/lib/tz-helpers')

describe('test getLocalTime winter (standard time)', () => {
  var nowStub = null
  beforeAll(() => {
    nowStub = sinon.stub(Date, 'now')
    nowStub.returns(new Date('2018-02-01T15:00:00.000Z'))
  })

  afterAll(() => {
    nowStub.restore()
    nowStub = null
  })

  it('returns correct local time UTC-5 standard time', () => {
    let localTime = getLocalTime(-5, true)
    expect(localTime.hours()).toEqual(10)
    expect(new Date(localTime)).toEqual(new Date('2018-02-01T10:00:00.000-05:00'))
  })
})

describe('test getLocalTime summer (DST)', () => {
  var nowStub = null
  beforeAll(() => {
    nowStub = sinon.stub(Date, 'now')
    nowStub.returns(new Date('2018-07-21T15:00:00.000Z'))
  })

  afterAll(() => {
    nowStub.restore()
    nowStub = null
  })

  it('returns correct local time UTC-5 DST', () => {
    let localTime = getLocalTime(-5, true)
    expect(localTime.hours()).toEqual(11)
    expect(new Date(localTime)).toEqual(new Date('2018-07-21T10:00:00.000-05:00'))
  })
})

describe('testing isBetweenTextingHours with env.TZ set', () => {
  var nowStub = null
  var tzHelpers = require('../../src/lib/tz-helpers')
  beforeAll(() => {
    tzHelpers.getProcessEnvTz.mockImplementation(() => 'America/Los_Angeles')
    nowStub = sinon.stub(Date, 'now')
    nowStub.returns(new Date('2018-02-01T15:00:00.000-05:00'))
  })

  afterAll(() => {
    jest.restoreAllMocks();
    nowStub.restore()
  })

  it('returns true if texting hours are not enforced', () => {
    expect(isBetweenTextingHours(null, makeConfig(1, 1, false))).toBeTruthy()
  })

  it('returns false if texting hours are 05-07 and time is 12:00', () => {
      expect(isBetweenTextingHours(null, makeConfig(5, 7, true))).toBeFalsy()
    }
  )

  it('returns false if texting hours are 14-21 and time is 12:00', () => {
      expect(isBetweenTextingHours(null, makeConfig(14, 21, true))).toBeFalsy()
    }
  )

  it('returns true if texting hours are 10-21 and time is 12:00', () => {
    expect(isBetweenTextingHours(null, makeConfig(10, 21, true))).toBeTruthy()
  })

  it('returns true if texting hours are 12-21 and time is 12:00', () => {
    expect(isBetweenTextingHours(null, makeConfig(12, 21, true))).toBeTruthy()
  })

  it('returns true if texting hours are 10-12 and time is 12:00', () => {
    expect(isBetweenTextingHours(null, makeConfig(10, 12, true))).toBeTruthy()
  })
})


describe('test isBetweenTextingHours with offset data supplied', () => {
    var nowStub = null
    var offsetData = {offset: -8, hasDST: true}
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      jest.doMock('../../src/lib/tz-helpers')
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
      nowStub = sinon.stub(Date, 'now')
      nowStub.returns(new Date('2018-02-01T12:00:00.000-08:00'))
    })

    afterAll(() => {
      jest.restoreAllMocks();
      nowStub.restore()
      nowStub = null
    })

    it('returns true if texting hours are not enforced', () => {
      expect(isBetweenTextingHours(offsetData, makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if texting hours are 05-07 and time is 12:00', () => {
        expect(isBetweenTextingHours(offsetData, makeConfig(5, 7, true))).toBeFalsy()
      }
    )

    it('returns false if texting hours are 14-21 and time is 12:00', () => {
        expect(isBetweenTextingHours(offsetData, makeConfig(14, 21, true))).toBeFalsy()
      }
    )

    it('returns true if texting hours are 10-21 and time is 12:00', () => {
      expect(isBetweenTextingHours(offsetData, makeConfig(10, 21, true))).toBeTruthy()
    })

    it('returns true if texting hours are 12-21 and time is 12:00', () => {
      expect(isBetweenTextingHours(offsetData, makeConfig(12, 21, true))).toBeTruthy()
    })

    it('returns true if texting hours are 10-12 and time is 12:00', () => {
      expect(isBetweenTextingHours(offsetData, makeConfig(10, 12, true))).toBeFalsy()
    })

    it('returns true if texting hours are 10-11 and time is 12:00', () => {
      expect(isBetweenTextingHours(offsetData, makeConfig(10, 13, true))).toBeTruthy()
    })
  }
)

describe('test isBetweenTextingHours with offset data NOT supplied', () => {
    var nowStub = null
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
      nowStub = sinon.stub(Date, 'now')
    })

    afterAll(() => {
      jest.restoreAllMocks();
      nowStub.restore()
      nowStub = null
    })

    it('returns true if texting hours are not enforced', () => {
      expect(isBetweenTextingHours(null, makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if texting hours are for MISSING TIME ZONE and time is 12:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T12:00:00.000-05:00'))
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 11:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T11:00:00.000-05:00'))
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 20:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T20:00:00.000-05:00'))
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 21:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T21:00:00.000-05:00'))
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeFalsy()
      }
    )
  }
)


describe('test defaultTimezoneIsBetweenTextingHours', () => {
    var nowStub = null
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
      jest.doMock('../../src/lib/tz-helpers')
      nowStub = sinon.stub(Date, 'now')
    })

    afterAll(() => {
      jest.restoreAllMocks();
      nowStub.restore()
      nowStub = null
    })

    it('returns true if texting hours are not enforced', () => {
      expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if time is 12:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T12:00:00.000-05:00'))
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if time is 11:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T11:00:00.000-05:00'))
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if time is 20:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T20:00:00.000-05:00'))
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if time is 21:00 EST', () => {
        nowStub.returns(new Date('2018-02-01T21:00:00.000-05:00'))
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeFalsy()
      }
    )
  }
)

describe('test convertOffsetsToStrings', () => {
  it('works', () => {
      let test_offsets = [[1, true], [2, false], [-1, true]]
      let strings_returned = convertOffsetsToStrings(test_offsets)
      expect(strings_returned).toHaveLength(3)
      expect(strings_returned[0]).toBe('1_1')
      expect(strings_returned[1]).toBe('2_0')
      expect(strings_returned[2]).toBe('-1_1')
    }
  )
})

describe('test getOffsets', () => {
  var nowStub = null
  beforeAll(() => {
    nowStub = sinon.stub(Date, 'now')
  })

  afterAll(() => {
    nowStub.restore()
    nowStub = null
  })

  it('works during daylight-savings time', () => {
    nowStub.returns(new Date('2018-07-21T17:00:00.000Z'))
    let offsets_returned = getOffsets(makeConfig(10, 12, true))
    expect(offsets_returned).toHaveLength(2)

    let valid_offsets_returned = offsets_returned[0]
    expect(valid_offsets_returned).toHaveLength(4)
    expect(valid_offsets_returned[0]).toBe('-7_1')
    expect(valid_offsets_returned[1]).toBe('-8_1')
    expect(valid_offsets_returned[2]).toBe('-6_0')
    expect(valid_offsets_returned[3]).toBe('-7_0')

    let invalid_offsets_returned = offsets_returned[1]
    expect(invalid_offsets_returned).toHaveLength(14)
    expect(invalid_offsets_returned[0]).toBe('-4_1')
    expect(invalid_offsets_returned[1]).toBe('-5_1')
    expect(invalid_offsets_returned[2]).toBe('-6_1')
    expect(invalid_offsets_returned[3]).toBe('-9_1')
    expect(invalid_offsets_returned[4]).toBe('-10_1')
    expect(invalid_offsets_returned[5]).toBe('-11_1')
    expect(invalid_offsets_returned[6]).toBe('10_1')
    expect(invalid_offsets_returned[7]).toBe('-4_0')
    expect(invalid_offsets_returned[8]).toBe('-5_0')
    expect(invalid_offsets_returned[9]).toBe('-8_0')
    expect(invalid_offsets_returned[10]).toBe('-9_0')
    expect(invalid_offsets_returned[11]).toBe('-10_0')
    expect(invalid_offsets_returned[12]).toBe('-11_0')
    expect(invalid_offsets_returned[13]).toBe('10_0')
  })

  it('works during standard time', () => {
    nowStub.returns(new Date('2018-02-01T17:00:00.000Z'))
    let offsets_returned = getOffsets(makeConfig(10, 12, true))
    expect(offsets_returned).toHaveLength(2)

    let valid_offsets_returned = offsets_returned[0]
    expect(valid_offsets_returned).toHaveLength(4)
    expect(valid_offsets_returned[0]).toBe('-6_1')
    expect(valid_offsets_returned[1]).toBe('-7_1')
    expect(valid_offsets_returned[2]).toBe('-6_0')
    expect(valid_offsets_returned[3]).toBe('-7_0')

    let invalid_offsets_returned = offsets_returned[1]
    expect(invalid_offsets_returned).toHaveLength(14)
    expect(invalid_offsets_returned[0]).toBe('-4_1')
    expect(invalid_offsets_returned[1]).toBe('-5_1')
    expect(invalid_offsets_returned[2]).toBe('-8_1')
    expect(invalid_offsets_returned[3]).toBe('-9_1')
    expect(invalid_offsets_returned[4]).toBe('-10_1')
    expect(invalid_offsets_returned[5]).toBe('-11_1')
    expect(invalid_offsets_returned[6]).toBe('10_1')
    expect(invalid_offsets_returned[7]).toBe('-4_0')
    expect(invalid_offsets_returned[8]).toBe('-5_0')
    expect(invalid_offsets_returned[9]).toBe('-8_0')
    expect(invalid_offsets_returned[10]).toBe('-9_0')
    expect(invalid_offsets_returned[11]).toBe('-10_0')
    expect(invalid_offsets_returned[12]).toBe('-11_0')
    expect(invalid_offsets_returned[13]).toBe('10_0')
  })
})
