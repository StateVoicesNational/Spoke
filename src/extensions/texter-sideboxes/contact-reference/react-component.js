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
  navigationToolbarChildren
}) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return contact && contact.messageStatus !== "needsMessage";
};

export class TexterSidebox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      copiedStatus: ""
    };
    this.displayLink = React.createRef();
  }

  copyToClipboard = () => {
    if (this.displayLink && this.displayLink.current) {
      this.displayLink.current.focus();
      this.displayLink.current.select();
      document.execCommand("copy");
      console.log("Copied");
      this.setState({ copiedStatus: " (copied)" });
    }
  };

  render() {
    const { campaign, assignment, contact, settingsData } = this.props;

    const { host, protocol } = document.location;
    const url = `${protocol}//${host}/app/${campaign.organization.id}/todos/review/${this.props.contact.id}`;
    return (
      <div>
        <div>
          <Tooltip title="Copy conversation link to clipboard">
            <IconButton
              onClick={this.copyToClipboard}
              style={{ padding: 0, height: 20, width: 20, paddingRight: 6 }}
              size="small"
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
        <TextField
          inputRef={this.displayLink}
          name={url}
          value={url}
          fullWidth
          inputProps={{ style: { fontSize: "12px" } }}
          onFocus={this.copyToClipboard}
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
  navigationToolbarChildren: type.object
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
            color="primary"
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
