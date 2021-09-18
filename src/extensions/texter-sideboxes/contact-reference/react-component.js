import type from "prop-types";
import React from "react";
import { Link } from "react-router";
import * as yup from "yup";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import TextField from "@material-ui/core/TextField";

export const displayName = () => "Contact Conversation URL";

export const showSidebox = ({
  contact,
  campaign,
  assignment,
  texter,
  navigationToolbarChildren,
  messageStatusFilter
}) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return contact && messageStatusFilter !== "needsMessage";
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

    const textContent = (
      <div>
        <Tooltip title="Copy conversation link to clipboard">
          <IconButton
            onClick={this.copyToClipboard}
            style={{ padding: 0, height: 20, width: 20, paddingRight: 6 }}
          >
            <FileCopyIcon />
          </IconButton>
        </Tooltip>
        <span onClick={this.copyToClipboard}>Get</span>
        {" a "}
        {settingsData.contactReferenceClickable ? (
          <Link target="_blank" to={url}>
            conversation link
          </Link>
        ) : (
          "conversation link"
        )}
        {this.state.copiedStatus}
      </div>
    );
    return (
      <div>
        <div>{textContent}</div>
        <TextField
          ref="displayLink"
          name={url}
          value={url}
          fullWidth
          inputProps={{ style: { fontSize: "12px " } }}
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
      <FormControlLabel
        label="Clickable reference link (vs. just copyable)"
        labelPlacement="end"
        control={
          <Switch
            checked={this.props.settingsData.contactReferenceClickable}
            onChange={event =>
              this.props.onToggle(
                "contactReferenceClickable",
                event.target.checked
              )
            }
          />
        }
      />
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
