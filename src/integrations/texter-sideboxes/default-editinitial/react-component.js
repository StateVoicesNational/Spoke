import type from "prop-types";
import React from "react";
import yup from "yup";
import Form from "react-formal";

export const displayName = () => "Allow editing of initial messages";

export const showSidebox = ({ contact, messageStatusFilter }) =>
  contact && messageStatusFilter === "needsMessage";

const defaultMessagePre =
  "It’s important not to automate sending texts to conform to FCC regulations. Please";
const defaultLinkText = "don’t alter script messages";
const defaultMessagePost =
  "except in circumstances where a custom reply is necessary.";

export class TexterSidebox extends React.Component {
  setMessageEditable = () => {
    const { parent } = this.props;
    if (parent.state && parent.state.messageReadOnly) {
      parent.setState({ messageReadOnly: false });
      parent.closeSideboxDialog();
    }
  };

  render() {
    const { settingsData } = this.props;
    return (
      <div>
        <p>
          {settingsData.editInitialMessagePre || defaultMessagePre}{" "}
          <a
            style={{ textDecoration: "underline" }}
            onClick={this.setMessageEditable}
          >
            {settingsData.editInitialLinkText || defaultLinkText}
          </a>{" "}
          {settingsData.editInitialMessagePost || defaultMessagePost}
        </p>
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
  editInitialMessagePre: yup.string(),
  editInitialLinkText: yup.string(),
  editInitialMessagePost: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <p>
          Some legal U.S. interpretations, suggest enabling this is important,
          so it&rsquo;s default-on, but you can disable it.
        </p>
        <Form.Field
          name="editInitialMessagePre"
          label="Text before link"
          hintText={`default: ${defaultMessagePre}`}
          fullWidth
        />
        <Form.Field
          name="editInitialLinkText"
          label="Link text to enable editing "
          hintText={`default: ${defaultLinkText}`}
          fullWidth
        />
        <Form.Field
          name="editInitialMessagePost"
          label="Text after link"
          hintText={`default: ${defaultMessagePost}`}
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
