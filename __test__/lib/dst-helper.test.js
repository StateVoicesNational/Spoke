import {DstHelper} from '../../src/lib/dst-helper'
import {DateTime, zone, DateFunctions} from 'timezonecomplete'

var MockDate = require('mockdate');

describe('test DstHelper', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('helps us figure out if we\'re in DST in February in New York', () => {
    MockDate.set('2018-02-01T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('America/New_York'))
    expect(DstHelper.isOffsetDst(d.offset(), 'America/New_York')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'America/New_York')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'America/New_York')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in July in New York', () => {
    MockDate.set('2018-07-21T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('America/New_York'))
    expect(DstHelper.isOffsetDst(d.offset(), 'America/New_York')).toBeTruthy()
    expect(DstHelper.isDateTimeDst(d, 'America/New_York')).toBeTruthy()
    expect(DstHelper.isDateDst(new Date(), 'America/New_York')).toBeTruthy()
  })

  it('helps us figure out if we\'re in DST in February in Sydney', () => {
    MockDate.set('2018-02-01T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('Australia/Sydney'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Australia/Sydney')).toBeTruthy()
    expect(DstHelper.isDateTimeDst(d, 'Australia/Sydney')).toBeTruthy()
    expect(DstHelper.isDateDst(new Date(), 'Australia/Sydney')).toBeTruthy()
  })

  it('helps us figure out if we\'re in DST in July in Sydney', () => {
    MockDate.set('2018-07-01T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('Australia/Sydney'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Australia/Sydney')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'Australia/Sydney')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'Australia/Sydney')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in February in Kathmandu, which has no DST', () => {
    MockDate.set('2018-02-01T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('Asia/Kathmandu'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'Asia/Kathmandu')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in July in Kathmandu, which has no DST', () => {
    MockDate.set('2018-07-01T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('Asia/Kathmandu'))
    expect(DstHelper.isOffsetDst(d.offset(), 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'Asia/Kathmandu')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'Asia/Kathmandu')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in February in Arizona, which has no DST', () => {
    MockDate.set('2018-02-01T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('US/Arizona'))
    expect(DstHelper.isOffsetDst(d.offset(), 'US/Arizona')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'US/Arizona')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'US/Arizona')).toBeFalsy()
  })

  it('helps us figure out if we\'re in DST in July in Arizona, which has no DST', () => {
    MockDate.set('2018-07-01T15:00:00Z')
    let d = new DateTime(new Date(), DateFunctions.Get, zone('US/Arizona'))
    expect(DstHelper.isOffsetDst(d.offset(), 'US/Arizona')).toBeFalsy()
    expect(DstHelper.isDateTimeDst(d, 'US/Arizona')).toBeFalsy()
    expect(DstHelper.isDateDst(new Date(), 'US/Arizona')).toBeFalsy()
  })

  it('correctly reports a timezone\'s offset and whether it has DST', () => {
    expect(DstHelper.getTimezoneOffsetHours('America/New_York')).toEqual(-5)
    expect(DstHelper.timezoneHasDst('America/New_York')).toBeTruthy()
    expect(DstHelper.getTimezoneOffsetHours('US/Arizona')).toEqual(-7)
    expect(DstHelper.timezoneHasDst('US/Arizona')).toBeFalsy()
    expect(DstHelper.getTimezoneOffsetHours('Europe/Paris')).toEqual(1)
    expect(DstHelper.timezoneHasDst('Europe/Paris')).toBeTruthy()
    expect(DstHelper.getTimezoneOffsetHours('Europe/London')).toEqual(0)
    expect(DstHelper.timezoneHasDst('Europe/London')).toBeTruthy()
  })
})