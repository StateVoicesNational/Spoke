import type from "prop-types";
import React from "react";
import yup from "yup";
import Form from "react-formal";

export const displayName = () =>
  "Hide media including images and videos from texters";

export const showSidebox = () => true;

export class TexterSidebox extends React.Component {
  constructor(props) {
    super(props);
    const { parent } = props;
    parent.setState({
      hideMedia: true
    });
  }

  render() {
    return null;
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

export const adminSchema = () => ({});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <p>
          When contacts reply with images/media Spoke will have a prompt for the
          contact to view the image/media. However, this is often a vehicle for
          offensive and graphic responses. We recommend enabling hiding media
          for most outreach campaigns, and to enable this for contacts that are
          more likely allies.
        </p>
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
