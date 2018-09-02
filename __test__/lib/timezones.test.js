import {
  convertOffsetsToStrings,
  defaultTimezoneIsBetweenTextingHours,
  getLocalTime,
  getOffsets,
  isBetweenTextingHours,
  getContactTimezone
} from '../../src/lib/index'

import { getProcessEnvDstReferenceTimezone } from '../../src/lib/tz-helpers'

var MockDate = require('mockdate')

const makeCampignTextingHoursConfig = (
  textingHoursEnforced,
  textingHoursStart,
  textingHoursEnd,
  timezone
) => {
  return {
    textingHoursEnforced,
    textingHoursStart,
    textingHoursEnd,
    timezone
  }
}

const makeCampaignOnlyWithTextingHoursConfigFields = (
  overrideOrganizationTextingHours,
  textingHoursEnforced,
  textingHoursStart,
  textingHoursEnd,
  timezone
) => {
  const textingHoursConfigFields = makeCampignTextingHoursConfig(
    textingHoursEnforced,
    textingHoursStart,
    textingHoursEnd,
    timezone
  )
  textingHoursConfigFields.overrideOrganizationTextingHours = overrideOrganizationTextingHours
  return textingHoursConfigFields
}

const makeConfig = (
  textingHoursStart,
  textingHoursEnd,
  textingHoursEnforced,
  campaignTextingHours
) => {
  return {
    textingHoursStart,
    textingHoursEnd,
    textingHoursEnforced,
    campaignTextingHours
  }
}

const makeLocationWithOnlyTimezoneData = (offset, hasDst) => {
  return { timezone: { offset, hasDst } }
}

const buildIsBetweenTextingHoursExpectForSpecifiedTimezone = (offsetData, start, end, timezone) => {
  return expect(isBetweenTextingHours(offsetData, makeConfig(0, 0, false, makeCampignTextingHoursConfig(true, start, end, timezone ))))
}

const buildIsBetweenTextingHoursExpect = (offsetData, start, end) => {
  return buildIsBetweenTextingHoursExpectForSpecifiedTimezone(offsetData, start, end, 'America/Los_Angeles')
}

const buildIsBetweenTextingHoursExpectWithNoOffset = (start, end) => {
  return expect(isBetweenTextingHours(null, makeConfig(0, 0, false, makeCampignTextingHoursConfig(true, start, end, 'America/New_York' ))))
}

jest.unmock('../../src/lib/timezones')
jest.mock('../../src/lib/tz-helpers')

describe('test getLocalTime winter (standard time)', () => {
  beforeAll(() => {
    MockDate.set('2018-02-01T15:00:00Z')
  })

  afterAll(() => {
    MockDate.reset()
  })

  it('returns correct local time UTC-5 standard time', () => {
    let localTime = getLocalTime(-5, true, getProcessEnvDstReferenceTimezone())
    expect(localTime.hours()).toEqual(10)
    expect(new Date(localTime)).toEqual(new Date('2018-02-01T10:00:00.000-05:00'))
  })
})

describe('test getLocalTime summer (DST)', () => {
  beforeEach(() => {
    MockDate.set('2018-07-21T15:00:00Z')
  })

  afterEach(() => {
    MockDate.reset()
  })

  it('returns correct local time UTC-5 DST', () => {
    let localTime = getLocalTime(-5, true, getProcessEnvDstReferenceTimezone())
    expect(localTime.hours()).toEqual(11)
    expect(new Date(localTime)).toEqual(new Date('2018-07-21T10:00:00.000-05:00'))
  })
})

describe('testing isBetweenTextingHours with env.TZ set', () => {
  var tzHelpers = require('../../src/lib/tz-helpers')
  beforeAll(() => {
    tzHelpers.getProcessEnvTz.mockImplementation(() => 'America/Los_Angeles')
    MockDate.set('2018-02-01T15:00:00.000-05:00')
  })

  afterAll(() => {
    jest.restoreAllMocks();
    MockDate.reset()
  })

  it('returns true if texting hours are not enforced', () => {
    expect(isBetweenTextingHours(null, makeConfig(1, 1, false))).toBeTruthy()
  })

  it('returns true if texting hours are not enforced and there are campaign texting hours with !textingHoursEnforced', () => {
    expect(isBetweenTextingHours(null, makeConfig(1, 1, false, makeCampignTextingHoursConfig(false, 0, 0, 'not_used')))).toBeTruthy()
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

describe('isBetweenTextingHours with campaign overrides works with DST', () => {
  afterEach(() => {
    MockDate.reset()
  })

  const easternOffsetData = {offset: -5, hasDST: true}
  const arizonaOffsetData = {offset: -7, hasDST: true}

  it('works for NYC in January', () => {
    MockDate.set('2018-01-01T15:00:00.000-05:00')
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 14, 18, 'US/Eastern').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 15, 18, 'US/Eastern').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 16, 18, 'US/Eastern').toBeFalsy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 17, 18, 'US/Eastern').toBeFalsy()
  })

  it('works for NYC in July', () => {
    MockDate.set('2018-06-01T15:00:00.000-05:00')
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 14, 18, 'US/Eastern').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 15, 18, 'US/Eastern').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 16, 18, 'US/Eastern').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(easternOffsetData, 17, 18, 'US/Eastern').toBeFalsy()
  })

  it('works for Arizona in January', () => {
    MockDate.set('2018-01-01T15:00:00.000-07:00')
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 14, 18, 'US/Arizona').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 15, 18, 'US/Arizona').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 16, 18, 'US/Arizona').toBeFalsy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 17, 18, 'US/Arizona').toBeFalsy()
  })

  it('works for Arizona in July', () => {
    MockDate.set('2018-06-01T15:00:00.000-07:00')
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 14, 18, 'US/Arizona').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 15, 18, 'US/Arizona').toBeTruthy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 16, 18, 'US/Arizona').toBeFalsy()
    buildIsBetweenTextingHoursExpectForSpecifiedTimezone(arizonaOffsetData, 17, 18, 'US/Arizona').toBeFalsy()
  })
})

describe('test isBetweenTextingHours with campaign overrides', () => {
  beforeAll(() => {
    MockDate.set('2018-02-01T15:00:00.000-05:00')
  })

  afterAll(() => {
    MockDate.reset()
  })

  const offsetData = {offset: -8, hasDST: true}

  it('returns false if texting hours are 05-07 and time is 12:00', () => {
      buildIsBetweenTextingHoursExpect(offsetData, 5, 7).toBeFalsy()
    }
  )

  it('returns false if texting hours are 14-21 and time is 12:00', () => {
      buildIsBetweenTextingHoursExpect(offsetData, 14, 21).toBeFalsy()
    }
  )

  it('returns true if texting hours are 10-21 and time is 12:00', () => {
    buildIsBetweenTextingHoursExpect(offsetData,10, 21).toBeTruthy()
  })

  it('returns true if texting hours are 12-21 and time is 12:00', () => {
    buildIsBetweenTextingHoursExpect(offsetData,12, 21).toBeTruthy()
  })

  it('returns false if texting hours are 10-12 and time is 12:00', () => {
    buildIsBetweenTextingHoursExpect(offsetData,10, 12).toBeFalsy()
  })

  it('returns false if texting hours are 16-21 and time is 3pm NY and offset data is not provided', () => {
    buildIsBetweenTextingHoursExpectWithNoOffset(16, 21).toBeFalsy()
  })

  it('returns true if texting hours are 09-21 and time is 3pm NY and offset data is not provided', () => {
    buildIsBetweenTextingHoursExpectWithNoOffset(9, 21).toBeTruthy()
  })
})

describe('test isBetweenTextingHours with offset data supplied', () => {
    var offsetData = {offset: -8, hasDST: true}
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      jest.doMock('../../src/lib/tz-helpers')
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
      MockDate.set('2018-02-01T12:00:00.000-08:00')
    })

    afterAll(() => {
      jest.restoreAllMocks();
      MockDate.reset()
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

describe('test isBetweenTextingHours with offset data empty', () => {
    var offsetData = {offset: null, hasDST: null}
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
    })

    afterEach(() => {
      MockDate.reset()
    })

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('returns true if texting hours are not enforced', () => {
      expect(isBetweenTextingHours(offsetData, makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if texting hours are for MISSING TIME ZONE and time is 12:00 EST', () => {
        MockDate.set('2018-02-01T12:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 11:00 EST', () => {
        MockDate.set('2018-02-01T11:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 20:00 EST', () => {
        MockDate.set('2018-02-01T20:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 21:00 EST', () => {
        MockDate.set('2018-02-01T21:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeFalsy()
      }
    )
  }
)

describe('test isBetweenTextingHours with offset data NOT supplied', () => {
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
    })

    afterEach(() => {
      MockDate.reset()
    })

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('returns true if texting hours are not enforced', () => {
      expect(isBetweenTextingHours(null, makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if texting hours are for MISSING TIME ZONE and time is 12:00 EST', () => {
        MockDate.set('2018-02-01T12:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 11:00 EST', () => {
        MockDate.set('2018-02-01T11:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 20:00 EST', () => {
        MockDate.set('2018-02-01T20:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 21:00 EST', () => {
        MockDate.set('2018-02-01T21:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeFalsy()
      }
    )
  }
)


describe('test defaultTimezoneIsBetweenTextingHours', () => {
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
      jest.doMock('../../src/lib/tz-helpers')
    })

    afterEach(() => {
      MockDate.reset()
    })

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('returns true if texting hours are not enforced', () => {
      expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if time is 12:00 EST', () => {
        MockDate.set('2018-02-01T12:00:00.000-05:00')
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if time is 11:00 EST', () => {
        MockDate.set('2018-02-01T11:00:00.000-05:00')
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if time is 20:00 EST', () => {
        MockDate.set('2018-02-01T20:00:00.000-05:00')
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if time is 21:00 EST', () => {
        MockDate.set('2018-02-01T21:00:00.000-05:00')
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
  afterEach(() => {
    MockDate.reset()
  })

  it('works during daylight-savings time', () => {
    MockDate.set('2018-07-21T17:00:00.000Z')
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
    MockDate.set('2018-02-01T17:00:00.000Z')
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

describe('test getContactTimezone', () => {
  var tzHelpers = require('../../src/lib/tz-helpers')

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns the location if one is supplied', () => {
    let location = makeLocationWithOnlyTimezoneData(7, true)
    expect(getContactTimezone({}, location)).toEqual(location)

    location = makeLocationWithOnlyTimezoneData(9, false)
    expect(getContactTimezone({}, location)).toEqual(location)
  })

  it('uses campaign.timezone if no location is supplied and the campaign overrides', () => {
    expect(
      getContactTimezone(
        makeCampaignOnlyWithTextingHoursConfigFields(
          true,
          true,
          14,
          16,
          'America/New_York'
        ),
        {}
      )
    ).toEqual({
      timezone: {
        offset: -5,
        hasDST: true
      }
    })
  })

})

describe('test isBetweenTextingHours with offset data supplied', () => {
    var offsetData = {offset: -8, hasDST: true}
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      jest.doMock('../../src/lib/tz-helpers')
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
      MockDate.set('2018-02-01T12:00:00.000-08:00')
    })

    afterAll(() => {
      jest.restoreAllMocks();
      MockDate.reset()
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

describe('test isBetweenTextingHours with offset data empty', () => {
    var offsetData = {offset: null, hasDST: null}
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
    })

    afterEach(() => {
      MockDate.reset()
    })

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('returns true if texting hours are not enforced', () => {
      expect(isBetweenTextingHours(offsetData, makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if texting hours are for MISSING TIME ZONE and time is 12:00 EST', () => {
        MockDate.set('2018-02-01T12:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 11:00 EST', () => {
        MockDate.set('2018-02-01T11:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 20:00 EST', () => {
        MockDate.set('2018-02-01T20:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 21:00 EST', () => {
        MockDate.set('2018-02-01T21:00:00.000-05:00')
        expect(isBetweenTextingHours(offsetData, makeConfig(null, null, true))).toBeFalsy()
      }
    )
  }
)

describe('test isBetweenTextingHours with offset data NOT supplied', () => {
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
    })

    afterEach(() => {
      MockDate.reset()
    })

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('returns true if texting hours are not enforced', () => {
      expect(isBetweenTextingHours(null, makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if texting hours are for MISSING TIME ZONE and time is 12:00 EST', () => {
        MockDate.set('2018-02-01T12:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 11:00 EST', () => {
        MockDate.set('2018-02-01T11:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 20:00 EST', () => {
        MockDate.set('2018-02-01T20:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if texting hours are for MISSING TIME ZONE and time is 21:00 EST', () => {
        MockDate.set('2018-02-01T21:00:00.000-05:00')
        expect(isBetweenTextingHours(null, makeConfig(null, null, true))).toBeFalsy()
      }
    )
  }
)


describe('test defaultTimezoneIsBetweenTextingHours', () => {
    var tzHelpers = require('../../src/lib/tz-helpers')
    beforeAll(() => {
      tzHelpers.getProcessEnvTz.mockImplementation(() => null)
      jest.doMock('../../src/lib/tz-helpers')
    })

    afterEach(() => {
      MockDate.reset()
    })

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('returns true if texting hours are not enforced', () => {
      expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, false))).toBeTruthy()
    })

    it('returns false if time is 12:00 EST', () => {
        MockDate.set('2018-02-01T12:00:00.000-05:00')
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if time is 11:00 EST', () => {
        MockDate.set('2018-02-01T11:00:00.000-05:00')
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeFalsy()
      }
    )

    it('returns false if time is 20:00 EST', () => {
        MockDate.set('2018-02-01T20:00:00.000-05:00')
        expect(defaultTimezoneIsBetweenTextingHours(makeConfig(null, null, true))).toBeTruthy()
      }
    )

    it('returns false if time is 21:00 EST', () => {
        MockDate.set('2018-02-01T21:00:00.000-05:00')
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
  afterEach(() => {
    MockDate.reset()
  })

  it('works during daylight-savings time', () => {
    MockDate.set('2018-07-21T17:00:00.000Z')
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
    MockDate.set('2018-02-01T17:00:00.000Z')
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

describe('test getContactTimezone', () => {
  var tzHelpers = require('../../src/lib/tz-helpers')

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns the location if one is supplied', () => {
    let location = makeLocationWithOnlyTimezoneData(7, true)
    expect(getContactTimezone({}, location)).toEqual(location)

    location = makeLocationWithOnlyTimezoneData(9, false)
    expect(getContactTimezone({}, location)).toEqual(location)
  })

  it('uses campaign.timezone if no location is supplied and the campaign overrides', () => {
    expect(
      getContactTimezone(
        makeCampaignOnlyWithTextingHoursConfigFields(
          true,
          true,
          14,
          16,
          'America/New_York'
        ),
        {}
      )
    ).toEqual({
      timezone: {
        offset: -5,
        hasDST: true
      }
    })
  })

  it("uses TZ if no location is supplied, and the campaign doesn't override, and TZ exists in the environment", () => {
    tzHelpers.getProcessEnvTz.mockImplementation(() => 'America/Denver')
    expect(
      getContactTimezone(
        makeCampaignOnlyWithTextingHoursConfigFields(
          false,
          true,
          14,
          16,
          'America/New_York'
        ),
        {}
      )
    ).toEqual({
      timezone: {
        offset: "-06:00",
        hasDST: true
      }
    })
  })

  it("uses TIMEZONE_CONFIG.missingTimeZone if no location is supplied, and the campaign doesn't override, and TZ is not in the environment", () => {
    expect(
      getContactTimezone(
        makeCampaignOnlyWithTextingHoursConfigFields(
          false,
          true,
          14,
          16,
          'America/New_York'
        ),
        {}
      )
    ).toEqual({
      timezone: {
        offset: -5,
        hasDST: true
      }
    })
  })
})
