import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import { getDisplayPhoneNumber } from "../lib/phone-format";
import { getLocalTime, getContactTimezone } from "../lib/timezones";
import { getProcessEnvDstReferenceTimezone } from "../lib/tz-helpers";
import ActionFace from "material-ui/svg-icons/action/face";
import IconButton from "material-ui/IconButton/IconButton";
import { grey100 } from "material-ui/styles/colors";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import ArrowForwardIcon from "material-ui/svg-icons/navigation/arrow-forward";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";

const inlineStyles = {
  toolbar: {
    backgroundColor: "rgb(81, 82, 89)",
    color: "white"
  }
};

const styles = StyleSheet.create({
  topFlex: {
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "column",
    alignContent: "flex-start",
    marginLeft: "-24px"
  },
  contactData: {
    flex: "1 2 auto",
    maxWidth: "80%",
    "@media(max-width: 375px)": {
      maxWidth: "50%" // iphone 5 and X
    }
  },
  titleSmall: {
    height: "18px",
    lineHeight: "18px",
    paddingTop: "4px",
    paddingRight: "10px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "95%"
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
    maxWidth: "90%"
  },
  contactToolbarIconButton: {
    padding: "3px",
    height: "56px",
    "@media(max-width: 350px)": {
      width: "50px"
    }
  },
  navigation: {
    flex: "0 0 130px",
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap"
  },
  navigationTitle: {
    flex: "1 1 auto",
    width: "3em",
    height: "100%",
    padding: "6px",
    textAlign: "center"
  }
});

const ContactToolbar = function ContactToolbar(props) {
  const { campaignContact, navigationToolbarChildren } = props;

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
        <div className={css(styles.topFlex)} style={{ width: "100%" }}>
          <IconButton
            onTouchTap={props.onExit}
            className={css(styles.contactToolbarIconButton)}
          >
            tooltip="Return Home" tooltipPosition="bottom-center" >
            <NavigateHomeIcon color={"white"} />
          </IconButton>
          <div className={css(styles.titleSmall)} style={{ color: "#B0B0B0" }}>
            Campaign ID: {props.campaign.id}
          </div>
          <div className={css(styles.titleBig)} title={props.campaign.title}>
            {props.campaign.title}
          </div>
        </div>
      </Toolbar>
      <Toolbar style={{ ...inlineStyles.toolbar, backgroundColor: "#7E808B" }}>
        <div className={`${css(styles.topFlex)} ${css(styles.contactData)}`}>
          <IconButton className={css(styles.contactToolbarIconButton)}>
            <ActionFace color="white" />
          </IconButton>

          <div className={css(styles.titleSmall)} style={{ color: "white" }}>
            {formattedLocalTime} - {formattedLocation}
          </div>
          <div
            className={css(styles.titleBig)}
            style={{ fontSize: "24px" }}
            title={"foo bar"}
          >
            {campaignContact.firstName}
          </div>
        </div>
        <div className={css(styles.navigation)}>
          <IconButton
            onTouchTap={navigationToolbarChildren.onPrevious}
            disabled={!navigationToolbarChildren.onPrevious}
            tooltip="Previous Contact"
            className={css(styles.contactToolbarIconButton)}
            style={{ flex: "0 0 56px", width: "45px" }}
          >
            <ArrowBackIcon
              color={
                navigationToolbarChildren.onPrevious
                  ? "white"
                  : "rgb(176, 176, 176)"
              }
            />
          </IconButton>
          <div className={css(styles.navigationTitle)}>
            {navigationToolbarChildren.title}
          </div>
          <IconButton
            onTouchTap={navigationToolbarChildren.onNext}
            disabled={!navigationToolbarChildren.onNext}
            tooltip="Next Contact"
            className={css(styles.contactToolbarIconButton)}
            style={{ flex: "0 0 56px", width: "45px" }}
          >
            <ArrowForwardIcon
              color={
                navigationToolbarChildren.onNext
                  ? "white"
                  : "rgb(176, 176, 176)"
              }
            />
          </IconButton>
        </div>
      </Toolbar>
    </div>
  );
};

ContactToolbar.propTypes = {
  campaignContact: PropTypes.object, // contacts for current assignment
  campaign: PropTypes.object,
  onExit: PropTypes.func,
  navigationToolbarChildren: PropTypes.object
};

export default ContactToolbar;
