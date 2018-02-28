import {DateTime, zone, DateFunctions} from 'timezonecomplete'


// a cache number of hours offset from GMT during DST per timezone
let _timezoneDstOffsets = {}

// a class to help us know if a date is DST in a given timezone
export class DstHelper {
  static isOffsetDst(offset: number, timezone: string): boolean {

    // if we don't have the offset for this timezone, calculate it now
    if (!(timezone in _timezoneDstOffsets)) {
      // If a location has DST, the offset from GMT at January 1 and July 1 will certainly
      // be different.  The greater of the two is the DST offset.  For our check, we
      // don't care when DST is (March-October in the northern hemisphere, October-March
      // in the southern hemisphere).  We only care about the offset during DST.
      let januaryDate = new DateTime(new Date().getFullYear(), 1, 1, 0, 0, 0, 0, zone(timezone))
      let julyDate = new DateTime(new Date().getFullYear(), 7, 1, 0, 0, 0, 0, zone(timezone))
      if (januaryDate.offset() == julyDate.offset()) {
        // there is no DTC in this timezone
        _timezoneDstOffsets[timezone] = undefined
      }
      else {
        _timezoneDstOffsets[timezone] = Math.max(januaryDate.offset(), julyDate.offset())
      }
    }

    // if this timezone has DST (meaning, january and july offsets were different)
    // and the offset from GMT passed into this function is the same as the timezone's
    // offset from GMT during DST, we return true.
    return _timezoneDstOffsets[timezone] && _timezoneDstOffsets[timezone] == offset
  }

  static isDateDst(date: Date, timezone: string): boolean {
    let d = new DateTime(date, DateFunctions.Get, zone(timezone))
    return DstHelper.isOffsetDst(d.offset(), timezone)
  }

  static isDateTimeDst(date: DateTime, timezone: string): boolean {
    return DstHelper.isOffsetDst(date.offset(), timezone)
  }
}

