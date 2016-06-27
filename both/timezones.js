const TIMEZONE_CONFIG = {
  allowedStart: 9,
  allowedEnd: 21,
  missingTimeZone: {
    offset: -5, // EST
    allowedStart: 12, // 12pm EST/9am PST
    allowedEnd: 21, // 9pm EST/6pm PST
  }
}

export const getLocalTime = (offset) => moment().utc().utcOffset(moment().isDST() ? offset + 1 : offset)

export const defaultTimezoneIsBetweenTextingHours = () => isBetweenTextingHours(null)

// Currently only USA
const ALL_OFFSETS = [-4, -5, -6, -7, -8, -9, -10, -11, 10]

export const validOffsets = () => _.filter(ALL_OFFSETS, (offset) => isBetweenTextingHours(offset))

// TODO hasDST or not?
export const isBetweenTextingHours = (userOffset) => {
  let offset, allowedStart, allowedEnd
  if (userOffset) {
    allowedStart = TIMEZONE_CONFIG.allowedStart
    allowedEnd = TIMEZONE_CONFIG.allowedEnd
    offset = userOffset
  } else {
    allowedStart = TIMEZONE_CONFIG.missingTimeZone.allowedStart
    allowedEnd = TIMEZONE_CONFIG.missingTimeZone.allowedEnd
    offset = TIMEZONE_CONFIG.missingTimeZone.offset
  }

  const localTime = getLocalTime(offset)
  return (localTime.hours() >= allowedStart && localTime.hours() < allowedEnd)
}
