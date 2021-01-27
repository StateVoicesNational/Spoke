import type from "prop-types";
import React from "react";
import yup from "yup";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import Dialog from "material-ui/Dialog";
import CircularProgress from "material-ui/CircularProgress";
import { Tabs, Tab } from "material-ui/Tabs";
import { css, StyleSheet } from "aphrodite";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";

export const displayName = () => "Mobilize Event Shifter";

export const showSidebox = ({ contact, messageStatusFilter, settingsData }) =>
  contact &&
  messageStatusFilter !== "needsMessage" &&
  (settingsData.mobilizeEventShifterBaseUrl ||
    window.MOBILIZE_EVENT_SHIFTER_URL);

const styles = StyleSheet.create({
  dialog: {
    paddingTop: 0,
    zIndex: 5000
  },
  dialogContentStyle: {
    width: "100%" // Still exists a maxWidth of 768px
  },
  iframe: {
    height: "80vh",
    width: "100%",
    border: "none"
  },
  loader: {
    paddingTop: 50,
    paddingLeft: "calc(50% - 25px)"
  }
});

export class TexterSidebox extends React.Component {
  constructor(props) {
    super(props);

    const { settingsData, contact } = props;

    const customFields = contact.customFields || {};
    const eventId =
      customFields.event_id || settingsData.mobilizeEventShifterDefaultEventId;

    this.state = {
      dialogOpen: false,
      eventiFrameLoading: true,
      alliFrameLoading: true,
      dialogTab: eventId ? "event" : "all"
    };
  }

  cleanPhoneNumber = phone => {
    // take the last 10 digits
    return phone
      .replace(/[^\d]/g, "")
      .split("")
      .reverse()
      .slice(0, 10)
      .reverse()
      .join("");
  };

  openDialog = () => {
    this.setState({
      dialogOpen: true
    });
  };

  iframeLoaded = iframeLoadingName => {
    const update = {};
    update[iframeLoadingName] = false;
    this.setState(update);
  };

  changeTab = e => {
    this.setState({
      dialogTab: e
    });
  };

  closeDialog = () => {
    this.setState({
      dialogOpen: false,
      eventiFrameLoading: true,
      alliFrameLoading: true
    });
  };

  buildUrlParamString = urlParams => {
    return _.map(
      urlParams,
      (val, key) => `${key}=${encodeURIComponent(val)}`
    ).join("&");
  };

  render() {
    const { settingsData, contact, campaign } = this.props;

    const customFields = contact.customFields || {};

    const eventId =
      customFields.event_id || settingsData.mobilizeEventShifterDefaultEventId;
    const urlParams = {
      first_name: contact.firstName || "",
      last_name: contact.lastName || "",
      phone: this.cleanPhoneNumber(contact.cell || ""),
      email: customFields.email || "",
      zip: customFields.zip || "",
      source: "P2P"
    };

    const urlParamString = this.buildUrlParamString(urlParams);
    const allEventsUrlParams = this.buildUrlParamString({
      zip: customFields.zip || ""
    });

    const mobilizeBaseUrl =
      settingsData.mobilizeEventShifterBaseUrl ||
      window.MOBILIZE_EVENT_SHIFTER_URL;

    return (
      <div>
        <FlatButton
          label="Schedule for Events"
          onClick={() => this.setState({ dialogOpen: true })}
          className={css(flexStyles.flatButton)}
          labelStyle={inlineStyles.flatButtonLabel}
        />
        <Dialog
          actions={[
            <FlatButton
              label="Cancel"
              primary={true}
              onClick={this.closeDialog}
            />
          ]}
          open={this.state.dialogOpen}
          onRequestClose={this.closeDialog}
          className={css(styles.dialog)}
          contentClassName={css(styles.dialogContentStyle)}
        >
          {eventId ? (
            <Tabs value={this.state.dialogTab} onChange={this.changeTab}>
              <Tab label="Event" value="event" />
              <Tab label="All Events" value="all" />
            </Tabs>
          ) : (
            ""
          )}
          {eventId ? (
            <div
              style={{
                display: this.state.dialogTab == "event" ? "block" : "none"
              }}
            >
              {this.state.eventiFrameLoading ? (
                <CircularProgress size={50} className={css(styles.loader)} />
              ) : (
                ""
              )}
              <iframe
                className={css(styles.iframe)}
                src={`${mobilizeBaseUrl}/event/${eventId}/?${urlParamString}`}
                onLoad={() => this.iframeLoaded("eventiFrameLoading")}
                style={{
                  display: this.state.eventiFrameLoading ? "none" : "block"
                }}
              />
            </div>
          ) : (
            ""
          )}
          <div
            style={{
              display: this.state.dialogTab == "all" ? "block" : "none"
            }}
          >
            {this.state.alliFrameLoading ? (
              <CircularProgress size={50} className={css(styles.loader)} />
            ) : (
              ""
            )}
            <iframe
              className={css(styles.iframe)}
              src={`${mobilizeBaseUrl}/?${allEventsUrlParams}`}
              onLoad={() => this.iframeLoaded("alliFrameLoading")}
              style={{
                display: this.state.alliFrameLoading ? "none" : "block"
              }}
            />
          </div>
        </Dialog>
      </div>
    );
  }
}

TexterSidebox.propTypes = {
  // data
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,

  // parent state
  disabled: type.bool,
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string
};

export const adminSchema = () => ({
  mobilizeEventShifterDefaultEventId: yup.string(),
  mobilizeEventShifterBaseUrl: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <Form.Field
          name="mobilizeEventShifterDefaultEventId"
          label="Set a default Event ID for when none is provided in CSV under a column called event_id"
          fullWidth
        />
        <Form.Field
          name="mobilizeEventShifterBaseUrl"
          label="Set the Base Mobilize Url for the campaign."
          fullWidth
          hintText={
            window.MOBILIZE_EVENT_SHIFTER_URL
              ? "Default: " + window.MOBILIZE_EVENT_SHIFTER_URL
              : ""
          }
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {};
