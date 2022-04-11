import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import { css, StyleSheet } from "aphrodite";

import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import GSTextField from "../../../components/forms/GSTextField";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";

export const displayName = () => "Mobilize Event Shifter";

export const showSidebox = ({ contact, settingsData }) =>
  contact &&
  contact.messageStatus !== "needsMessage" &&
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
  }
});

export class TexterSidebox extends React.Component {
  constructor(props) {
    super(props);

    const { settingsData, contact } = props;

    let customFields = contact.customFields || {};

    if (typeof customFields === "string") {
      try {
        customFields = JSON.parse(contact.customFields);
      } catch (err) {
        console.log("Error parsing customFields:", err.message);
      }
    }

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

  changeTab = (e, value) => {
    this.setState({
      dialogTab: value
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

    let customFields = contact.customFields || {};

    if (typeof customFields === "string") {
      try {
        customFields = JSON.parse(contact.customFields);
      } catch (err) {
        console.log("Error parsing customFields:", err.message);
      }
    }

    const eventId =
      customFields.event_id || settingsData.mobilizeEventShifterDefaultEventId;
    const urlParams = {
      first_name: contact.firstName || "",
      last_name: contact.lastName || "",
      phone: this.cleanPhoneNumber(contact.cell || ""),
      email: customFields.email || "",
      zip: contact.zip || "",
      source: customFields.source || "P2P"
    };

    const urlParamString = this.buildUrlParamString(urlParams);
    const allEventsUrlParams = this.buildUrlParamString({
      zip: contact.zip || ""
    });

    const mobilizeBaseUrl =
      settingsData.mobilizeEventShifterBaseUrl ||
      window.MOBILIZE_EVENT_SHIFTER_URL;

    return (
      <div>
        <Button
          onClick={() => this.setState({ dialogOpen: true })}
          className={css(flexStyles.flatButton)}
        >
          Schedule for Events
        </Button>
        <Dialog
          maxWidth="md"
          open={this.state.dialogOpen}
          onClose={this.closeDialog}
          className={css(styles.dialog)}
        >
          <DialogContent>
            {eventId && (
              <Tabs value={this.state.dialogTab} onChange={this.changeTab}>
                <Tab label="Event" value="event" />
                <Tab label="All Events" value="all" />
              </Tabs>
            )}
            {eventId && (
              <div
                style={{
                  display: this.state.dialogTab == "event" ? "block" : "none"
                }}
              >
                {this.state.eventiFrameLoading && (
                  <CircularProgress size={50} />
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
            )}
            <div
              style={{
                display: this.state.dialogTab == "all" ? "block" : "none"
              }}
            >
              {this.state.alliFrameLoading && <CircularProgress size={50} />}
              <iframe
                className={css(styles.iframe)}
                src={`${mobilizeBaseUrl}/?${allEventsUrlParams}`}
                onLoad={() => this.iframeLoaded("alliFrameLoading")}
                style={{
                  display: this.state.alliFrameLoading ? "none" : "block"
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={this.closeDialog}>
              Cancel
            </Button>
          </DialogActions>
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
  navigationToolbarChildren: type.object
};

export const adminSchema = () => ({
  mobilizeEventShifterDefaultEventId: yup.string(),
  mobilizeEventShifterBaseUrl: yup.string()
});

export class AdminConfig extends React.Component {
  componentDidMount() {
    const { settingsData } = this.props;
    // set defaults
    const defaults = {};
    if (!settingsData.mobilizeEventShifterBaseUrl) {
      defaults.mobilizeEventShifterBaseUrl =
        window.MOBILIZE_EVENT_SHIFTER_URL || "";
    }

    if (Object.values(defaults).length) {
      this.props.setDefaultsOnMount(defaults);
    }
  }

  render() {
    return (
      <div>
        <Form.Field
          as={GSTextField}
          name="mobilizeEventShifterDefaultEventId"
          label="Set a default Event ID for when none is provided in CSV under a column called event_id"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="mobilizeEventShifterBaseUrl"
          label="Set the Base Mobilize Url for the campaign."
          fullWidth
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  setDefaultsOnMount: type.func
};
