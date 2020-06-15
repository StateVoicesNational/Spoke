import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import { Toolbar } from "material-ui/Toolbar";
import { getLocalTime, getContactTimezone } from "../../lib/timezones";
import { getProcessEnvDstReferenceTimezone } from "../../lib/tz-helpers";
import ActionFace from "material-ui/svg-icons/action/face";
import IconButton from "material-ui/IconButton/IconButton";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import ArrowForwardIcon from "material-ui/svg-icons/navigation/arrow-forward";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";
import SideboxOpenIcon from "material-ui/svg-icons/action/build";
import momenttz from "moment-timezone";

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
  campaignData: {
    flex: "1 2 auto",
    maxWidth: "80%",
    "@media(max-width: 375px)": {
      maxWidth: "70%" // iphone 5 and X
    }
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
  navigationSideBox: {
    flexBasis: "24px",
    // width also in Controls.jsx::getSideboxDialogOpen
    "@media(min-width: 575px)": {
      display: "none"
    }
  },
  navigation: {
    flexGrow: 0,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap"
  },
  navigationTitle: {
    flex: "1 1 auto",
    width: "4em",
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
  let offset;
  let hasDST;

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

  const campaignTimezone =
    props.campaign.timezone || getProcessEnvDstReferenceTimezone();
  let formattedLocalTime;
  if (offset === undefined) {
    const zone = momenttz.tz.zone(campaignTimezone);
    offset = zone.parse(Date.now()) / -60;
    hasDST = false;
  }

  formattedLocalTime = getLocalTime(offset, hasDST, campaignTimezone).format(
    "LT"
  ); // format('h:mm a')

  return (
    <div>
      <Toolbar style={inlineStyles.toolbar}>
        <div className={`${css(styles.topFlex)} ${css(styles.campaignData)}`}>
          <IconButton
            onClick={props.onExit}
            className={css(styles.contactToolbarIconButton)}
            tooltip="Return Home"
            tooltipPosition="bottom-right"
          >
            <NavigateHomeIcon color={"white"} />
          </IconButton>
          <div className={css(styles.titleSmall)} style={{ color: "#B0B0B0" }}>
            Campaign ID: {props.campaign.id}
          </div>
          <div className={css(styles.titleBig)} title={props.campaign.title}>
            {props.campaign.title}
          </div>
        </div>
        {props.onSideboxButtonClick ? (
          <div
            className={`${css(styles.navigation)} ${css(
              styles.navigationSideBox
            )}`}
          >
            <IconButton
              tooltip="Open Details"
              onClick={props.onSideboxButtonClick}
              className={css(styles.contactToolbarIconButton)}
              style={{ flex: "0 0 56px", width: "45px" }}
            >
              <SideboxOpenIcon color="white" />
            </IconButton>
          </div>
        ) : null}
      </Toolbar>
      <Toolbar style={{ ...inlineStyles.toolbar, backgroundColor: "#7E808B" }}>
        <div className={`${css(styles.topFlex)} ${css(styles.contactData)}`}>
          <IconButton
            className={css(styles.contactToolbarIconButton)}
            tooltip={`?contact=${campaignContact.id}`}
            tooltipPosition="bottom-right"
          >
            <ActionFace color="white" />
          </IconButton>

          <div className={css(styles.titleSmall)} style={{ color: "white" }}>
            {formattedLocalTime} - {formattedLocation}
          </div>
          <div className={css(styles.titleBig)} style={{ fontSize: "24px" }}>
            {campaignContact.firstName}
          </div>
        </div>
        <div className={css(styles.navigation)} style={{ flexBasis: "130px" }}>
          <IconButton
            onClick={navigationToolbarChildren.onPrevious}
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
            onClick={navigationToolbarChildren.onNext}
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
  onSideboxButtonClick: PropTypes.func,
  onExit: PropTypes.func,
  navigationToolbarChildren: PropTypes.object
};

export default ContactToolbar;
