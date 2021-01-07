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
          For compliance for person-to-person texting in the US, it&rsquo;s
          important to allow the first message to be editable. By default, the
          first message is editable. Turning on this sidebox, makes it editable
          only after clicking the link text which properly discourages texters
          from changing the script. You can modify the text on the sidebox
          itself.
        </p>
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
