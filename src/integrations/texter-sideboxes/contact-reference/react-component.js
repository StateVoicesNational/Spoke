import type from "prop-types";
import React from "react";
import { Link } from "react-router";
import yup from "yup";
import Toggle from "material-ui/Toggle";
import CopyIcon from "material-ui/svg-icons/content/content-copy";
import IconButton from "material-ui/IconButton/IconButton";
import TextField from "material-ui/TextField";

export const displayName = () => "Contact Conversation URL";

export const showSidebox = ({
  contact,
  campaign,
  assignment,
  texter,
  navigationToolbarChildren,
  messageStatusFilter,
  disabled
}) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return messageStatusFilter !== "needsMessage";
};

export class TexterSidebox extends React.Component {
  state = {
    copiedStatus: ""
  };

  copyToClipboard = () => {
    if (this.refs.displayLink) {
      this.refs.displayLink.focus();
      document.execCommand("copy");
      console.log("Copied");
      this.setState({ copiedStatus: " (copied)" });
    }
  };

  render() {
    const { campaign, assignment, contact, settingsData } = this.props;

    const { host, protocol } = document.location;
    const url = `${protocol}//${host}/app/${campaign.organization.id}/todos/review/${this.props.contact.id}`;

    const textContent = [
      <IconButton
        onClick={this.copyToClipboard}
        tooltip="Copy conversation link to clipboard"
        tooltipPosition="bottom-right"
        style={{ padding: 0, height: 20, width: 20, paddingRight: 6 }}
        iconStyle={{ height: 14, width: 14 }}
      >
        <CopyIcon />
      </IconButton>,
      <span onClick={this.copyToClipboard}>Get</span>,
      " a ",
      settingsData.contactReferenceClickable ? (
        <Link target="_blank" to={url}>
          conversation link
        </Link>
      ) : (
        "conversation link"
      ),
      this.state.copiedStatus
    ];
    return (
      <div>
        <div>{textContent}</div>
        <TextField
          ref="displayLink"
          name={url}
          value={url}
          onFocus={event => event.target.select()}
          fullWidth
          inputStyle={{ fontSize: "12px" }}
        />
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
  contactReferenceClickable: yup.boolean()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <Toggle
        label="Clickable reference link (vs. just copyable)"
        toggled={this.props.settingsData.contactReferenceClickable}
        onToggle={(toggler, val) =>
          this.props.onToggle("contactReferenceClickable", val)
        }
      />
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
