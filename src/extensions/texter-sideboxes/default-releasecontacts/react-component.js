import type from "prop-types";
import React from "react";
import * as yup from "yup";
import { StyleSheet, css } from "aphrodite";
import { withRouter } from "react-router";
import Form from "react-formal";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import gql from "graphql-tag";
import GSTextField from "../../../components/forms/GSTextField";
import loadData from "../../../containers/hoc/load-data";
import theme from "../../../styles/mui-theme";

const styles = StyleSheet.create({
  marginBottom: {
    marginBottom: theme.spacing(2)
  }
});

export const displayName = () => "Release Contacts";

export const showSidebox = ({
  settingsData,
  assignment,
  contact,
  campaign,
  finished,
  isSummary
}) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return (
    !finished &&
    (campaign.useDynamicAssignment ||
      settingsData.releaseContactsNonDynamicToo) &&
    (assignment.hasContacts || assignment.allContactsCount) &&
    (settingsData.releaseContactsReleaseConvos ||
      (contact &&
        contact.messageStatus === "needsMessage" &&
        assignment.unmessagedCount) ||
      (isSummary && assignment.unmessagedCount))
  );
};

export const showSummary = showSidebox;

const defaulReleaseContactsBatchTitle = "Can't send the rest of these texts?";
const defaultReleaseContactsBatchLabel = "Done for the day";
const defaultReleaseContactsConvosTitle = "Need to give up?";
const defaultReleaseContactsConvosLabel = "Release all my contacts";

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
    const { contact, settingsData, assignment } = this.props;
    const showReleaseConvos =
      settingsData.releaseContactsReleaseConvos &&
      ((contact && contact.messageStatus !== "needsMessage") ||
        assignment.unrepliedCount ||
        assignment.hasUnreplied);
    return (
      <div>
        {assignment.unmessagedCount ||
        (contact &&
          contact.messageStatus === "needsMessage" &&
          assignment.hasUnmessaged) ? (
          <div className={css(styles.marginBottom)}>
            <div>
              {settingsData.releaseContactsBatchTitle
                ? settingsData.releaseContactsBatchTitle
                : defaulReleaseContactsBatchTitle}
            </div>
            <Button
              variant="outlined"
              onClick={() => this.handleReleaseContacts(false)}
            >
              {settingsData.releaseContactsBatchLabel ||
                defaultReleaseContactsBatchLabel}
            </Button>
          </div>
        ) : null}
        {showReleaseConvos && (
          <div className={css(styles.marginBottom)}>
            <div>
              {settingsData.releaseContactsConvosTitle
                ? settingsData.releaseContactsConvosTitle
                : defaultReleaseContactsConvosTitle}
            </div>
            <Button
              variant="outlined"
              onClick={() => this.handleReleaseContacts(true)}
              label={
                settingsData.releaseContactsConvosLabel ||
                defaultReleaseContactsConvosLabel
              }
            >
              {settingsData.releaseContactsConvosLabel ||
                defaultReleaseContactsConvosLabel}
            </Button>
          </div>
        )}
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
  finished: type.bool
};

export const mutations = {
  releaseContacts: ownProps => releaseConversations => ({
    mutation: gql`
      mutation releaseContacts(
        $assignmentId: String!
        $contactsFilter: ContactsFilter!
        $needsResponseFilter: ContactsFilter!
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
          unmessagedCount: contactsCount(contactsFilter: $contactsFilter)
          hasUnmessaged: contactsCount(contactsFilter: $contactsFilter)
          maybeUnrepliedCount: contactsCount(
            contactsFilter: $needsResponseFilter
          )
        }
      }
    `,
    variables: {
      assignmentId: ownProps.assignment.id,
      releaseConversations,
      contactsFilter: {
        messageStatus: "needsMessage",
        isOptedOut: false,
        validTimezone: true
      },
      needsResponseFilter: {
        messageStatus: releaseConversations ? "needsResponse" : "needsMessage",
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
  componentDidMount() {
    const { settingsData } = this.props;
    // set defaults
    const defaults = {};
    if (!settingsData.releaseContactsBatchTitle) {
      defaults.releaseContactsBatchTitle = defaulReleaseContactsBatchTitle;
    }
    if (!settingsData.releaseContactsBatchLabel) {
      defaults.releaseContactsBatchLabel = defaultReleaseContactsBatchLabel;
    }
    if (!settingsData.releaseContactsConvosTitle) {
      defaults.releaseContactsConvosTitle = defaultReleaseContactsConvosTitle;
    }
    if (!settingsData.releaseContactsConvosLabel) {
      defaults.releaseContactsConvosLabel = defaultReleaseContactsConvosLabel;
    }

    if (Object.values(defaults).length) {
      this.props.setDefaultsOnMount(defaults);
    }
  }

  render() {
    return (
      <div>
        <FormControlLabel
          label="Also allow release of conversations"
          labelPlacement="start"
          control={
            <Switch
              color="primary"
              checked={!!this.props.settingsData.releaseContactsReleaseConvos}
              onChange={event =>
                this.props.onToggle(
                  "releaseContactsReleaseConvos",
                  event.target.checked
                )
              }
            />
          }
        />

        <FormControlLabel
          label="Enable for campaigns even without Dynamic Assignment enabled."
          labelPlacement="start"
          control={
            <Switch
              color="primary"
              checked={!!this.props.settingsData.releaseContactsNonDynamicToo}
              onChange={event =>
                this.props.onToggle(
                  "releaseContactsNonDynamicToo",
                  event.target.checked
                )
              }
            />
          }
        />
        <Form.Field
          as={GSTextField}
          name="releaseContactsBatchTitle"
          label="Title for releasing contacts"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="releaseContactsBatchLabel"
          label="Button label for releasing unmessaged contacts"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="releaseContactsConvosTitle"
          label="Title for releasing even replies"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="releaseContactsConvosLabel"
          label="Button label for releasing all assigned contacts"
          fullWidth
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  enabled: type.bool,
  data: type.string,
  setDefaultsOnMount: type.func
};
