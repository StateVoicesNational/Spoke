import PropTypes from "prop-types";
import React from "react";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import { getDisplayPhoneNumber } from "../../lib/phone-format";
import { getLocalTime, getContactTimezone } from "../../lib/timezones";
import { getProcessEnvDstReferenceTimezone } from "../../lib/tz-helpers";
import { grey100 } from "material-ui/styles/colors";

const inlineStyles = {
  toolbar: {
    backgroundColor: grey100
  },
  cellToolbarTitle: {
    fontSize: "1em"
  },
  locationToolbarTitle: {
    fontSize: "1em"
  },
  timeToolbarTitle: {
    fontSize: "1em"
  }
};

const ContactToolbar = function ContactToolbar(props) {
  const { campaignContact, rightToolbarIcon } = props;

  const { location } = campaignContact;

  let city = "";
  let state = "";
  let timezone = null;
  let offset = 0;
  let hasDST = false;

  if (location) {
    city = location.city;
    state = location.state;
    timezone = location.timezone;
    if (timezone) {
      offset = timezone.offset || offset;
      hasDST = timezone.hasDST || hasDST;
    }
    const adjustedLocationTZ = getContactTimezone(props.campaign, location);
    if (adjustedLocationTZ && adjustedLocationTZ.timezone) {
      offset = adjustedLocationTZ.timezone.offset;
      hasDST = adjustedLocationTZ.timezone.hasDST;
    }
  }

  let formattedLocation = `${city}`;
  if (city && state) {
    formattedLocation = `${formattedLocation}, `;
  }
  formattedLocation = `${formattedLocation} ${state}`;

  const dstReferenceTimezone = props.campaign.overrideOrganizationTextingHours
    ? props.campaign.timezone
    : getProcessEnvDstReferenceTimezone();

  const formattedLocalTime = getLocalTime(
    offset,
    hasDST,
    dstReferenceTimezone
  ).format("LT"); // format('h:mm a')
  return (
    <div>
      <Toolbar style={inlineStyles.toolbar}>
        <ToolbarGroup>
          <ToolbarTitle
            text={campaignContact.firstName}
            title={`id:${campaignContact.id} m:${campaignContact.messages.length} s:${campaignContact.messageStatus}`}
          />
          <ToolbarTitle style={inlineStyles.cellToolbarTitle} />
          {location ? (
            <ToolbarTitle
              style={inlineStyles.timeToolbarTitle}
              text={formattedLocalTime}
            />
          ) : (
            ""
          )}
          {location ? (
            <ToolbarTitle
              style={inlineStyles.locationToolbarTitle}
              text={formattedLocation}
            />
          ) : (
            ""
          )}
          {rightToolbarIcon}
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
};

ContactToolbar.propTypes = {
  campaignContact: PropTypes.object, // contacts for current assignment
  rightToolbarIcon: PropTypes.element,
  campaign: PropTypes.object
};

export default ContactToolbar;
