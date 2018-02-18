var tc = require('timezonecomplete')

let _timezoneDstOffsets = {}
export class DstHelper {
  static isOffsetDst(offset: number, timezone: string): boolean {

    if (!(timezone in _timezoneDstOffsets)) {
      let januaryDate = new tc.DateTime(new Date().getFullYear(), 1, 1, 0, 0, 0, 0, tc.zone(timezone))
      let julyDate = new tc.DateTime(new Date().getFullYear(), 7, 1, 0, 0, 0, 0, tc.zone(timezone))
      _timezoneDstOffsets[timezone] = Math.max(januaryDate.offset(), julyDate.offset())
    }

    return _timezoneDstOffsets [timezone] == offset
  }

  static isDateDst(date: Date, timezone: string): boolean {
    let d = new tc.DateTime(date, tc.DateFunctions.Get, tc.zone(timezone))
    return DstHelper.isOffsetDst(d.offset(), timezone)
  }

  static isDateTimeDst(date: tc.DateTime, timezone: string): boolean {
    return DstHelper.isOffsetDst(date.offset(), timezone)
  }
}

