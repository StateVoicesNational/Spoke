import moment from 'moment'


const TIMEZONE_CONFIG = {
  allowedStart: 9,
  allowedEnd: 21,
  missingTimeZone: {
    offset: -5, // EST
    hasDST: true,
    allowedStart: 12, // 12pm EST/9am PST
    allowedEnd: 21 // 9pm EST/6pm PST
  }
}

export const getLocalTime = (offset, hasDST) => moment().utc().utcOffset((moment().isDST() && hasDST) ? offset + 1 : offset)

export const isBetweenTextingHours = (offsetData) => {
  let offset
  let hasDST
  let allowedStart
  let allowedEnd
  if (offsetData) {
    allowedStart = TIMEZONE_CONFIG.allowedStart
    allowedEnd = TIMEZONE_CONFIG.allowedEnd
    offset = offsetData.offset
    hasDST = offsetData.hasDST
  } else {
    allowedStart = TIMEZONE_CONFIG.missingTimeZone.allowedStart
    allowedEnd = TIMEZONE_CONFIG.missingTimeZone.allowedEnd
    offset = TIMEZONE_CONFIG.missingTimeZone.offset
    hasDST = TIMEZONE_CONFIG.missingTimeZone.hasDST
  }

  const localTime = getLocalTime(offset, hasDST)
  return (localTime.hours() >= allowedStart && localTime.hours() < allowedEnd)
}


// Currently only USA
const ALL_OFFSETS = [-4, -5, -6, -7, -8, -9, -10, -11, 10]

export const defaultTimezoneIsBetweenTextingHours = () => isBetweenTextingHours(null)

export const getOffsets = () => {
  const valid = []
  const invalid = []

  const dst = [true, false]
  dst.forEach((hasDST) => (
    ALL_OFFSETS.forEach((offset) => {
      if (isBetweenTextingHours({ offset, hasDST })) {
        valid.push([offset, hasDST])
      } else {
        invalid.push([offset, hasDST])
      }
    })

  ))

  return [valid, invalid]
}
