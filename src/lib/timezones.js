import moment from "moment-timezone";

import {
  getProcessEnvTz,
  getProcessEnvDstReferenceTimezone
} from "../lib/tz-helpers";
import { DstHelper } from "./dst-helper";

const TIMEZONE_CONFIG = {
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
        const offset = TIMEZONE_CONFIG.missingTimeZone.offset;
        const hasDST = TIMEZONE_CONFIG.missingTimeZone.hasDST;
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

  if (getProcessEnvTz()) {
    return getUtcFromTimezoneAndHour(
      getProcessEnvTz(),
      organization.textingHoursEnd
    );
  }

  if (contactTimezone && contactTimezone.offset) {
    return getUtcFromOffsetAndHour(
      contactTimezone.offset,
      contactTimezone.hasDST,
      organization.textingHoursEnd,
      getProcessEnvDstReferenceTimezone()
    );
  } else {
    return getUtcFromOffsetAndHour(
      TIMEZONE_CONFIG.missingTimeZone.offset,
      TIMEZONE_CONFIG.missingTimeZone.hasDST,
      organization.textingHoursEnd,
      getProcessEnvDstReferenceTimezone()
    );
  }
};

export const getLocalTime = (offset, hasDST, dstReferenceTimezone) => {
  return moment()
    .utc()
    .utcOffset(
      DstHelper.isDateDst(new Date(), dstReferenceTimezone) && hasDST
        ? offset + 1
        : offset
    );
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

  if (getProcessEnvTz()) {
    const today = moment.tz(getProcessEnvTz()).format("YYYY-MM-DD");
    const start = moment
      .tz(`${today}`, getProcessEnvTz())
      .add(config.textingHoursStart, "hours");
    const stop = moment
      .tz(`${today}`, getProcessEnvTz())
      .add(config.textingHoursEnd, "hours");
    return moment.tz(getProcessEnvTz()).isBetween(start, stop, null, "[]");
  }

  return isOffsetBetweenTextingHours(
    offsetData,
    config.textingHoursStart,
    config.textingHoursEnd,
    TIMEZONE_CONFIG.missingTimeZone,
    getProcessEnvDstReferenceTimezone()
  );
};

// Currently USA (-4 through -11) and Australia (10)
const ALL_OFFSETS = [-4, -5, -6, -7, -8, -9, -10, -11, 10];

export const defaultTimezoneIsBetweenTextingHours = config =>
  isBetweenTextingHours(null, config);

export function convertOffsetsToStrings(offsetArray) {
  const result = [];
  offsetArray.forEach(offset => {
    result.push(offset[0].toString() + "_" + (offset[1] === true ? "1" : "0"));
  });
  return result;
}

export const getOffsets = config => {
  const offsets = ALL_OFFSETS.slice(0);

  const valid = [];
  const invalid = [];

  const dst = [true, false];
  dst.forEach(hasDST =>
    offsets.forEach(offset => {
      if (isBetweenTextingHours({ offset, hasDST }, config)) {
        valid.push([offset, hasDST]);
      } else {
        invalid.push([offset, hasDST]);
      }
    })
  );

  const convertedValid = convertOffsetsToStrings(valid);
  const convertedInvalid = convertOffsetsToStrings(invalid);
  return [convertedValid, convertedInvalid];
};
