import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import GSTextField from "../../../components/forms/GSTextField";

export const displayName = () => "Celebration Gif";

export const showSidebox = ({
  contact,
  campaign,
  assignment,
  texter,
  navigationToolbarChildren,
  messageStatusFilter,
  finished
}) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  if (
    (contact && finished) ||
    (messageStatusFilter === "needsMessage" &&
      assignment.allContactsCount &&
      assignment.unmessagedCount === 0)
  ) {
    return "popup";
  }
};

export class TexterSidebox extends React.Component {
  render() {
    const { campaign, assignment, contact, settingsData } = this.props;

    return (
      <div style={{ textAlign: "center" }}>
        <h2>{settingsData.celebrationGifTopMessage || "Hooray!"}</h2>
        {settingsData.celebrationGifUrl ? (
          <img
            src={settingsData.celebrationGifUrl}
            alt={settingsData.celebrationGifAltText}
          />
        ) : null}
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
  celebrationGifTopMessage: yup.string(),
  celebrationGifUrl: yup.string(),
  celebrationGifAltText: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <Form.Field
          as={GSTextField}
          name="celebrationGifTopMessage"
          label="Top Message"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="celebrationGifUrl"
          label="GIF public url"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="celebrationGifAltText"
          label="GIF alt text"
          fullWidth
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
