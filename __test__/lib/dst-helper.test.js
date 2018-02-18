import {DstHelper} from '../../src/lib/dst-helper'
var tc = require('timezonecomplete')

var MockDate = require('mockdate');

describe('test DstHelper', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('helps us figure out if we\'re in DST in February in New York', () => {
    MockDate.set('2018-02-01T15:00:00Z')
    let d = new tc.DateTime(new Date(), tc.DateFunctions.Get, tc.zone('America/New_York'))
    expect(DstHelper.isOffsetDst(d.offset(), 'America/New_York')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'America/New_York')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'America/New_York')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in July in New York', () => {
    MockDate.set('2018-07-21T15:00:00Z')
    let d = new tc.DateTime(new Date(), tc.DateFunctions.Get, tc.zone('America/New_York'))
    expect(DstHelper.isOffsetDst(d.offset(), 'America/New_York')).toBeTruthy()
    expect(DstHelper.isDateTimeDst(d, 'America/New_York')).toBeTruthy()
    expect(DstHelper.isDateDst(new Date(), 'America/New_York')).toBeTruthy()
  })

  it('helps us figure out if we\'re in DST in February in Sydney', () => {
    MockDate.set('2018-02-01T15:00:00Z')
    let d = new tc.DateTime(new Date(), tc.DateFunctions.Get, tc.zone('Australia/Sydney'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Australia/Sydney')).toBeTruthy()
    expect(DstHelper.isDateTimeDst(d, 'Australia/Sydney')).toBeTruthy()
    expect(DstHelper.isDateDst(new Date(), 'Australia/Sydney')).toBeTruthy()
  })

  it('helps us figure out if we\'re in DST in July in Sydney', () => {
    MockDate.set('2018-07-01T15:00:00Z')
    let d = new tc.DateTime(new Date(), tc.DateFunctions.Get, tc.zone('Australia/Sydney'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Australia/Sydney')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'Australia/Sydney')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'Australia/Sydney')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in February in Kathmandu', () => {
    MockDate.set('2018-02-01T15:00:00Z')
    let d = new tc.DateTime(new Date(), tc.DateFunctions.Get, tc.zone('Asia/Kathmandu'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'Asia/Kathmandu')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in July in Kathmandu', () => {
    MockDate.set('2018-07-01T15:00:00Z')
    let d = new tc.DateTime(new Date(), tc.DateFunctions.Get, tc.zone('Asia/Kathmandu'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'Asia/Kathmandu')).toBeFalsy()
  })
})