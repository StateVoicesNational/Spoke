import moment from "moment-timezone";

import {
  getProcessEnvTz,
  getProcessEnvDstReferenceTimezone
} from "../lib/tz-helpers";
import { DstHelper } from "./dst-helper";
import { getConfig } from "../server/api/lib/config";

const TIMEZONE_US_FALLBACK_WINDOW = {
  missingTimeZone: {
    offset: -5, // EST
    hasDST: true,
    allowedStart: 12, // 12pm EST/9am PST
    allowedEnd: 21 // 9pm EST/6pm PST
  }
};

export const getContactTimezone = (campaign, location) => {
  if (location) {
    const returnLocation = Object.assign({}, location);
    if (location.timezone == null || location.timezone.offset == null) {
      let timezoneData = null;

      if (campaign.overrideOrganizationTextingHours) {
        const offset = DstHelper.getTimezoneOffsetHours(campaign.timezone);
        const hasDST = DstHelper.timezoneHasDst(campaign.timezone);
        timezoneData = { offset, hasDST };
      } else if (getProcessEnvTz()) {
        const offset = DstHelper.getTimezoneOffsetHours(getProcessEnvTz());
        const hasDST = DstHelper.timezoneHasDst(getProcessEnvTz());
        timezoneData = { offset, hasDST };
      } else {
        const offset = TIMEZONE_US_FALLBACK_WINDOW.missingTimeZone.offset;
        const hasDST = TIMEZONE_US_FALLBACK_WINDOW.missingTimeZone.hasDST;
        timezoneData = { offset, hasDST };
      }
      returnLocation.timezone = timezoneData;
    }
    return returnLocation;
  }
};

export const getUtcFromOffsetAndHour = (
  offset,
  hasDst,
  hour,
  dstReferenceTimezone
) => {
  const isDst = moment()
    .tz(dstReferenceTimezone)
    .isDST();
  return moment()
    .utcOffset(offset + (hasDst && isDst ? 1 : 0))
    .hour(hour)
    .startOf("hour")
    .utc();
};

export const getUtcFromTimezoneAndHour = (timezone, hour) => {
  return moment()
    .tz(timezone)
    .hour(hour)
    .startOf("hour")
    .utc();
};

export const getSendBeforeTimeUtc = (
  contactTimezone,
  organization,
  campaign
) => {
  if (campaign.overrideOrganizationTextingHours) {
    if (!campaign.textingHoursEnforced) {
      return null;
    }

    if (contactTimezone && contactTimezone.offset) {
      return getUtcFromOffsetAndHour(
        contactTimezone.offset,
        contactTimezone.hasDST,
        campaign.textingHoursEnd,
        campaign.timezone
      );
    } else {
      return getUtcFromTimezoneAndHour(
        campaign.timezone,
        campaign.textingHoursEnd
      );
    }
  }

  if (!organization.textingHoursEnforced) {
    return null;
  }

  const defaultTimezone = getProcessEnvTz(
    getConfig("DEFAULT_TZ", organization)
  );
  if (contactTimezone && contactTimezone.offset) {
    return getUtcFromOffsetAndHour(
      contactTimezone.offset,
      contactTimezone.hasDST,
      organization.textingHoursEnd,
      getProcessEnvDstReferenceTimezone()
    );
  } else if (defaultTimezone) {
    return getUtcFromTimezoneAndHour(
      defaultTimezone,
      organization.textingHoursEnd
    );
  } else {
    return getUtcFromOffsetAndHour(
      TIMEZONE_US_FALLBACK_WINDOW.missingTimeZone.offset,
      TIMEZONE_US_FALLBACK_WINDOW.missingTimeZone.hasDST,
      organization.textingHoursEnd,
      getProcessEnvDstReferenceTimezone()
    );
  }
};

export const getLocalTime = (offset, hasDST, dstReferenceTimezone) => {
  const isDateDST = DstHelper.isDateDst(new Date(), dstReferenceTimezone);
  return moment()
    .utc()
    .utcOffset(hasDST && isDateDST ? offset + 1 : offset);
};

const isOffsetBetweenTextingHours = (
  offsetData,
  textingHoursStart,
  textingHoursEnd,
  missingTimezoneConfig,
  dstReferenceTimezone
) => {
  let offset;
  let hasDST;
  let allowedStart;
  let allowedEnd;
  if (offsetData && offsetData.offset) {
    allowedStart = textingHoursStart;
    allowedEnd = textingHoursEnd;
    offset = offsetData.offset;
    hasDST = offsetData.hasDST;
  } else {
    allowedStart = missingTimezoneConfig.allowedStart;
    allowedEnd = missingTimezoneConfig.allowedEnd;
    offset = missingTimezoneConfig.offset;
    hasDST = missingTimezoneConfig.hasDST;
  }

  const localTime = getLocalTime(offset, hasDST, dstReferenceTimezone);
  return localTime.hours() >= allowedStart && localTime.hours() < allowedEnd;
};

export const isBetweenTextingHours = (offsetData, config) => {
  if (config.campaignTextingHours) {
    if (!config.campaignTextingHours.textingHoursEnforced) {
      return true;
    }
  } else if (!config.textingHoursEnforced) {
    // organization setting
    return true;
  }

  if (config.campaignTextingHours) {
    const { campaignTextingHours } = config;
    const missingTimezoneConfig = {
      allowedStart: campaignTextingHours.textingHoursStart,
      allowedEnd: campaignTextingHours.textingHoursEnd,
      offset: DstHelper.getTimezoneOffsetHours(campaignTextingHours.timezone),
      hasDST: DstHelper.timezoneHasDst(campaignTextingHours.timezone)
    };

    return isOffsetBetweenTextingHours(
      offsetData,
      campaignTextingHours.textingHoursStart,
      campaignTextingHours.textingHoursEnd,
      missingTimezoneConfig,
      campaignTextingHours.timezone
    );
  }

  const localTimezone = getProcessEnvTz(config.defaultTimezone);
  if (!offsetData && localTimezone) {
    const today = moment.tz(localTimezone).format("YYYY-MM-DD");
    const start = moment
      .tz(`${today}`, localTimezone)
      .add(config.textingHoursStart, "hours");
    const stop = moment
      .tz(`${today}`, localTimezone)
      .add(config.textingHoursEnd, "hours");
    return moment.tz(localTimezone).isBetween(start, stop, null, "[]");
  }
  return isOffsetBetweenTextingHours(
    offsetData,
    config.textingHoursStart,
    config.textingHoursEnd,
    TIMEZONE_US_FALLBACK_WINDOW.missingTimeZone,
    getProcessEnvDstReferenceTimezone()
  );
};

// Currently USA (-4 through -11), but campaign timezones will supplant this list
const ALL_OFFSETS = [-4, -5, -6, -7, -8, -9, -10, -11, 10];

export const defaultTimezoneIsBetweenTextingHours = config =>
  isBetweenTextingHours(null, config);

export function convertOffsetsToStrings(offsetArray) {
  return offsetArray.map(
    offset => offset[0].toString() + "_" + (offset[1] === true ? "1" : "0")
  );
}

export const getOffsets = (config, campaignOffsets) => {
  // campaignOffsets is an array of strings. E.g.: ['-5_1', ...]. Convert this
  // to an array of ints to make it consistent with ALL_OFFSETS
  const offsets = campaignOffsets
    ? [
        ...new Set(
          campaignOffsets.map(offset => {
            return parseInt(offset.split("_", 1)[0]);
          })
        )
      ]
    : ALL_OFFSETS;
  const valid = [];
  const invalid = [];

  const dst = [true, false];
  dst.forEach(hasDST =>
    offsets.forEach(offset => {
      if (offset === 0 || offset) {
        if (isBetweenTextingHours({ offset, hasDST }, config)) {
          valid.push([offset, hasDST]);
        } else {
          invalid.push([offset, hasDST]);
        }
      }
    })
  );

  const convertedValid = convertOffsetsToStrings(valid);
  const convertedInvalid = convertOffsetsToStrings(invalid);
  return [convertedValid, convertedInvalid];
};
