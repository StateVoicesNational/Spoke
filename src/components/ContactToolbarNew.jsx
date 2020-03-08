import PropTypes from "prop-types";
import React from "react";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import { getDisplayPhoneNumber } from "../lib/phone-format";
import { getLocalTime, getContactTimezone } from "../lib/timezones";
import { getProcessEnvDstReferenceTimezone } from "../lib/tz-helpers";
import { grey100 } from "material-ui/styles/colors";

const inlineStyles = {
  toolbar: {
    backgroundColor: "#515259",
    color: "white"
  },
  topFlex: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "column",
    alignContent: "space-between"
  },
  titleSmall: {
    height: "18px",
    lineHeight: "18px",
    paddingTop: "4px",
    paddingRight: "10px",
    color: "#B0B0B0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "50%"
  },
  titleBig: {
    height: "34px",
    lineHeight: "34px",
    paddingRight: "10px",
    fontWeight: "bold",
    color: "white",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "50%"
  }
};

const ContactToolbar = function ContactToolbar(props) {
  const { campaignContact, leftToolbarIcon } = props;

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

  let formattedLocation = `${state}`;
  if (city && state) {
    formattedLocation = `${formattedLocation}, `;
  }
  formattedLocation = `${formattedLocation}${city}`;

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
        {leftToolbarIcon}
        <div style={inlineStyles.topFlex}>
          <div style={inlineStyles.titleSmall}>
            {props.navigationToolbarChildren.title}
          </div>
          <div style={inlineStyles.titleBig} title={props.campaign.title}>
            <span style={{ color: "#B0B0B0" }}>({props.campaign.id})</span>{" "}
            {props.campaign.title}
          </div>
          <div style={inlineStyles.titleSmall}>
            {formattedLocalTime} - {formattedLocation}
          </div>
          <div
            style={{ fontSize: "24px", ...inlineStyles.titleBig }}
            title={`id:${campaignContact.id} m:${campaignContact.messages.length} s:${campaignContact.messageStatus}`}
          >
            {campaignContact.firstName}
          </div>
        </div>
      </Toolbar>
    </div>
  );
};

ContactToolbar.propTypes = {
  campaignContact: PropTypes.object, // contacts for current assignment
  campaign: PropTypes.object,
  leftToolbarIcon: PropTypes.element,
  navigationToolbarChildren: PropTypes.object
};

export default ContactToolbar;
