import type from "prop-types";
import React from "react";
import { Link } from "react-router";
import yup from "yup";
import Toggle from "material-ui/Toggle";

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
  render() {
    const { campaign, assignment, contact } = this.props;
    const url = `/app/${campaign.organization.id}/todos/${assignment.id}/allreplies?contact=${this.props.contact.id}`;
    return (
      <div>
        <Link to={url}>Conversation link</Link>
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
