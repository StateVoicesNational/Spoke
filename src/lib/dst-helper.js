import { DateTime, zone, DateFunctions } from 'timezonecomplete'


class TimezoneOffsetAndDst {
  constructor(tzOffsetMinutes: number, hasDst: boolean) {
    this.tzOffsetMinutes = tzOffsetMinutes
    this.hasDst = hasDst
  }
}

const _timezoneOffsetAndDst = {}


// a class to help us know if a date is DST in a given timezone
export class DstHelper {

  static ensureTimezoneDstCalculated(timezone) {
    if (!(timezone in _timezoneOffsetAndDst)) {
      // If a location has DST, the offset from GMT at January 1 and June 1 will certainly
      // be different.  The greater of the two is the DST offset.  For our check, we
      // don't care when DST is (March-October in the northern hemisphere, October-March
      // in the southern hemisphere).  We only care about the offset during DST.
      const januaryDate = new DateTime(new Date().getFullYear(), 1, 1, 0, 0, 0, 0, zone(timezone))
      const julyDate = new DateTime(new Date().getFullYear(), 6, 1, 0, 0, 0, 0, zone(timezone))
      _timezoneOffsetAndDst[timezone] = new TimezoneOffsetAndDst(
        Math.min(januaryDate.offset(), julyDate.offset()),
        januaryDate.offset() !== julyDate.offset()
      )
    }
  }

  static getTimezoneOffsetHours(timezone:string): number {
    DstHelper.ensureTimezoneDstCalculated(timezone)
    return _timezoneOffsetAndDst[timezone].tzOffsetMinutes/60
  }

  static timezoneHasDst(timezone: string): boolean {
    DstHelper.ensureTimezoneDstCalculated(timezone)
    return _timezoneOffsetAndDst[timezone].hasDst
  }

  static isOffsetDst(offset: number, timezone: string): boolean {
    DstHelper.ensureTimezoneDstCalculated(timezone)

    // if this timezone has DST (meaning, january and july offsets were different)
    // and the offset from GMT passed into this function is the same as the timezone's
    // offset from GMT during DST, we return true.
    const timezoneOffsetAndDst = _timezoneOffsetAndDst[timezone]
    return timezoneOffsetAndDst.hasDst && (timezoneOffsetAndDst.tzOffsetMinutes + 60) === offset
  }

  static isDateDst(date: Date, timezone: string): boolean {
    let d = new DateTime(date, DateFunctions.Get, zone(timezone))
    return DstHelper.isOffsetDst(d.offset(), timezone)
  }

  static isDateTimeDst(date: DateTime, timezone: string): boolean {
    return DstHelper.isOffsetDst(date.offset(), timezone)
  }
}

