import type from "prop-types";
import React from "react";
import yup from "yup";
import { css } from "aphrodite";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import Toggle from "material-ui/Toggle";
import { withRouter } from "react-router";
import gql from "graphql-tag";

import loadData from "../../../containers/hoc/load-data";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";

export const displayName = () => "Release Contacts";

export const showSidebox = ({
  settingsData,
  messageStatusFilter,
  assignment,
  campaign,
  finished,
  isSummary
}) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return (
    assignment.allContactsCount &&
    !finished &&
    (campaign.useDynamicAssignment ||
      settingsData.releaseContactsNonDynamicToo) &&
    (settingsData.releaseContactsReleaseConvos ||
      (messageStatusFilter === "needsMessage" && assignment.unmessagedCount) ||
      (isSummary && assignment.unmessagedCount))
  );
};

export const showSummary = showSidebox;

export class TexterSideboxClass extends React.Component {
  handleReleaseContacts = async releaseConversations => {
    await this.props.mutations.releaseContacts(releaseConversations);
    this.gotoTodos();
  };

  gotoTodos = () => {
    const { campaign } = this.props;
    this.props.router.push(`/app/${campaign.organization.id}/todos`);
  };

  render() {
    const { settingsData, messageStatusFilter, assignment } = this.props;
    const showReleaseConvos =
      settingsData.releaseContactsReleaseConvos &&
      (messageStatusFilter !== "needsMessage" || assignment.unrepliedCount);
    return (
      <div style={{}}>
        {assignment.unmessagedCount ? (
          <div>
            <div>
              {settingsData.releaseContactsBatchTitle ? (
                settingsData.releaseContactsBatchTitle
              ) : (
                <span>Can&rsquo;t send the rest of these texts?</span>
              )}
            </div>
            <FlatButton
              onClick={() => this.handleReleaseContacts(false)}
              label={
                settingsData.releaseContactsBatchLabel || "Done for the day"
              }
              className={css(flexStyles.flatButton)}
              labelStyle={inlineStyles.flatButtonLabel}
            />
          </div>
        ) : null}
        {showReleaseConvos ? (
          <div style={{ marginTop: "12px" }}>
            <div>
              {settingsData.releaseContactsConvosTitle
                ? settingsData.releaseContactsConvosTitle
                : "Need to give up?"}
            </div>
            <FlatButton
              onClick={() => this.handleReleaseContacts(true)}
              label={
                settingsData.releaseContactsConvosLabel ||
                "Release all my contacts"
              }
              className={css(flexStyles.flatButton)}
              labelStyle={inlineStyles.flatButtonLabel}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

TexterSideboxClass.propTypes = {
  router: type.object,
  mutations: type.object,

  // data
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,

  // parent state
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string,
  finished: type.bool
};

export const mutations = {
  releaseContacts: ownProps => releaseConversations => ({
    mutation: gql`
      mutation releaseContacts(
        $assignmentId: String!
        $contactsFilter: ContactsFilter!
        $releaseConversations: Boolean
      ) {
        releaseContacts(
          assignmentId: $assignmentId
          releaseConversations: $releaseConversations
        ) {
          id
          contacts(contactsFilter: $contactsFilter) {
            id
          }
          allContactsCount: contactsCount
        }
      }
    `,
    variables: {
      assignmentId: ownProps.assignment.id,
      releaseConversations,
      contactsFilter: {
        messageStatus: ownProps.messageStatusFilter,
        isOptedOut: false,
        validTimezone: true
      }
    }
  })
};

export const TexterSidebox = loadData({ mutations })(
  withRouter(TexterSideboxClass)
);

// This is a bit of a trick
// Normally we'd want to implement a separate component,
// but we have crafted it to work in both contexts.
// If you make changes, make sure you test in both!
export const SummaryComponent = TexterSidebox;

export const adminSchema = () => ({
  releaseContactsReleaseConvos: yup.boolean(),
  releaseContactsNonDynamicToo: yup.boolean(),
  releaseContactsBatchTitle: yup.string(),
  releaseContactsBatchLabel: yup.string(),
  releaseContactsConvosTitle: yup.string(),
  releaseContactsConvosLabel: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <Toggle
          label="Also allow release of conversations"
          toggled={this.props.settingsData.releaseContactsReleaseConvos}
          onToggle={(toggler, val) =>
            this.props.onToggle("releaseContactsReleaseConvos", val)
          }
        />
        <Toggle
          label="Enable for campaigns even without Dynamic Assignment enabled."
          toggled={this.props.settingsData.releaseContactsNonDynamicToo}
          onToggle={(toggler, val) =>
            this.props.onToggle("releaseContactsNonDynamicToo", val)
          }
        />
        <Form.Field
          name="releaseContactsBatchTitle"
          label="Title for releasing contacts"
          fullWidth
          hintText="default: Can't send the rest of these texts?"
        />
        <Form.Field
          name="releaseContactsBatchLabel"
          label="Button label for releasing unmessaged contacts"
          fullWidth
          hintText="default: Done for the day"
        />
        <Form.Field
          name="releaseContactsConvosTitle"
          label="Title for releasing even replies"
          fullWidth
          hintText="default: Need to give up?"
        />
        <Form.Field
          name="releaseContactsConvosLabel"
          label="Button label for releasing all assigned contacts"
          fullWidth
          hintText="default: Release all my contacts"
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  enabled: type.bool,
  data: type.string
};
