import type from "prop-types";
import React from "react";
import yup from "yup";
import Form from "react-formal";

export const displayName = () => "Allow editing of initial messages";

export const showSidebox = ({ contact, messageStatusFilter }) =>
  contact && messageStatusFilter === "needsMessage";

const defaultExpandText = "Sending Initial Messages";
const defaultMessagePre = (
  <span>
    It’s important to follow all training materials and campaign manager
    guidance while texting. Please <u>don’t</u>
  </span>
);
const defaultLinkText = "change the initial script";
const defaultMessagePost =
  "unless instructed by your campaign administrator.  Making changes may flag your account for admins.";

export class TexterSidebox extends React.Component {
  constructor(props) {
    super(props);
    const { parent } = props;
    if (!parent.state.messageReadOnlyChanged) {
      // This makes it read-only by default and then they'll need to click again to make it editable.
      parent.setState({
        messageReadOnly: true,
        messageReadOnlyChanged: true
      });
    }
    this.state = {
      expanded: false
    };
  }

  setMessageEditable = () => {
    const { parent } = this.props;
    if (parent.state && parent.state.messageReadOnly) {
      parent.setState({
        messageReadOnly: false
      });
      parent.closeSideboxDialog();
    }
  };

  render() {
    const { settingsData } = this.props;
    const expandMode =
      !settingsData.editInitialExpandText ||
      /\w+/.test(settingsData.editInitialExpandText);
    return (
      <div>
        {expandMode ? (
          <div>
            <a
              onClick={() => this.setState({ expanded: !this.state.expanded })}
            >
              <u>{settingsData.editInitialExpandText || defaultExpandText}</u>
            </a>
          </div>
        ) : null}
        {!expandMode || this.state.expanded ? (
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
  editInitialExpandText: yup.string(),
  editInitialMessagePre: yup.string(),
  editInitialLinkText: yup.string(),
  editInitialMessagePost: yup.string()
});

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
        <Form.Field
          name="editInitialExpandText"
          label="Text to expand instructions"
          hintText={`default: ${defaultExpandText} - set to a single space to disable the expand click`}
          fullWidth
        />
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
