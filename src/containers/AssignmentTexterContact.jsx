import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import OldControls from "../components/AssignmentTexter/OldControls";
import Controls from "../components/AssignmentTexter/Controls";
import { applyScript } from "../lib/scripts";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import yup from "yup";
import BulkSendButton from "../components/AssignmentTexter/BulkSendButton";
import CircularProgress from "material-ui/CircularProgress";
import Snackbar from "material-ui/Snackbar";
import { isBetweenTextingHours } from "../lib";
import { withRouter } from "react-router";
import { getContactTimezone } from "../lib/timezones";
import { dataTest } from "../lib/attributes";

const styles = StyleSheet.create({
  overlay: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.2,
    backgroundColor: "black",
    color: "white",
    zIndex: 1000000
  }
});

const inlineStyles = {
  snackbar: {
    zIndex: 1000001
  }
};

export class AssignmentTexterContact extends React.Component {
  constructor(props) {
    super(props);

    const { assignment, campaign } = this.props;
    const { contact } = this.props;

    let disabled = false;
    let disabledText = "Sending...";
    let snackbarOnTouchTap = null;
    let snackbarActionTitle = null;
    let snackbarError = null;

    if (assignment.id !== contact.assignmentId || campaign.isArchived) {
      disabledText = "";
      disabled = true;
      snackbarError = "Your assignment has changed";
      snackbarOnTouchTap = this.goBackToTodos;
      snackbarActionTitle = "Back to Todos";
    } else if (contact.optOut && !this.props.reviewContactId) {
      disabledText = "Skipping opt-out...";
      disabled = true;
    } else if (!this.isContactBetweenTextingHours(contact)) {
      disabledText = "Refreshing ...";
      disabled = true;
    }

    this.state = {
      disabled,
      disabledText,
      // this prevents jitter by not showing the optout/skip buttons right after sending
      snackbarError,
      snackbarActionTitle,
      snackbarOnTouchTap
    };

    this.setDisabled = this.setDisabled.bind(this);
  }

  componentDidMount() {
    const { contact } = this.props;
    if (contact.optOut) {
      if (!this.props.reviewContactId) {
        this.skipContact();
      }
    } else if (!this.isContactBetweenTextingHours(contact)) {
      setTimeout(() => {
        this.props.refreshData();
        this.setState({ disabled: false });
      }, 1500);
    }
  }

  setDisabled = async (disabled = true) => {
    this.setState({ disabled });
  };

  getMessageTextFromScript = script => {
    const { campaign, contact, texter } = this.props;

    return script
      ? applyScript({
          contact,
          texter,
          script,
          customFields: campaign.customFields
        })
      : null;
  };

  createMessageToContact(text) {
    const { texter, assignment } = this.props;
    const { contact } = this.props;

    return {
      contactNumber: contact.cell,
      userId: texter.id,
      text,
      assignmentId: assignment.id
    };
  }

  goBackToTodos = () => {
    const { campaign } = this.props;
    this.props.router.push(`/app/${campaign.organization.id}/todos`);
  };

  handleSendMessageError = e => {
    // NOTE: status codes don't currently work so all errors will appear
    // as "Something went wrong" keeping this code in here because
    // we want to replace status codes with Apollo 2 error codes.
    if (e.status === 402) {
      this.goBackToTodos();
    } else if (e.status === 400) {
      const newState = {
        snackbarError: e.message
      };

      if (e.message === "Your assignment has changed") {
        newState.snackbarActionTitle = "Back to todos";
        newState.snackbarOnTouchTap = this.goBackToTodos;
        this.setState(newState);
      } else {
        // opt out or send message Error
        this.setState({
          disabled: true,
          disabledText: e.message
        });
        this.skipContact();
      }
    } else {
      console.error(e);
      this.setState({
        disabled: true,
        snackbarError: "Something went wrong!"
      });
    }
  };

  handleMessageFormSubmit = async ({ messageText }) => {
    const { contact } = this.props;
    try {
      const message = this.createMessageToContact(messageText);
      if (this.state.disabled) {
        return; // stops from multi-send
      }
      this.setState({ disabled: true });
      console.log("sendMessage", contact.id);
      await this.props.mutations.sendMessage(message, contact.id);

      await this.handleSubmitSurveys();
      this.props.onFinishContact(contact.id);
    } catch (e) {
      this.handleSendMessageError(e);
      setTimeout(() => {
        this.props.onFinishContact(contact.id);
      }, 750);
    }
  };

  handleQuestionResponseChange = ({ questionResponses }) => {
    this.setState({ questionResponses });
  };

  handleCreateCannedResponse = async ({ cannedResponse }) => {
    try {
      const saveObject = {
        ...cannedResponse,
        campaignId: this.props.campaign.id,
        userId: this.props.texter.id
      };
      await this.props.mutations.createCannedResponse(saveObject);
    } catch (err) {
      console.log(
        "handleCreateCannedRepsonse Error",
        err,
        cannedResponse,
        this
      );
    }
  };

  handleSubmitSurveys = async () => {
    const { contact } = this.props;
    if (!this.state.questionResponses) {
      return; // no state change
    }

    const deletionIds = [];
    const questionResponseObjects = [];

    const interactionStepIds = Object.keys(this.state.questionResponses);

    const count = interactionStepIds.length;

    for (let i = 0; i < count; i++) {
      const interactionStepId = interactionStepIds[i];
      const value = this.state.questionResponses[interactionStepId];
      if (value) {
        questionResponseObjects.push({
          interactionStepId,
          campaignContactId: contact.id,
          value
        });
      } else {
        deletionIds.push(interactionStepId);
      }
    }
    if (questionResponseObjects.length) {
      await this.props.mutations.updateQuestionResponses(
        questionResponseObjects,
        contact.id
      );
    }
    if (deletionIds.length) {
      await this.props.mutations.deleteQuestionResponses(
        deletionIds,
        contact.id
      );
    }
  };

  handleUpdateTags = async tags => {
    const { contact } = this.props;
    await this.props.mutations.updateContactTags(tags, contact.id);
  };

  handleReleaseContacts = async releaseConversations => {
    const { assignment } = this.props;
    const result = await this.props.mutations.releaseContacts(
      assignment.id,
      releaseConversations
    );
    return result;
  };

  handleEditStatus = async (messageStatus, finishContact) => {
    const { contact } = this.props;
    await this.props.mutations.editCampaignContactMessageStatus(
      messageStatus,
      contact.id
    );
    if (finishContact) {
      await this.handleSubmitSurveys();
      this.props.onFinishContact();
    }
  };

  handleOptOut = async ({ optOutMessageText }) => {
    const { contact } = this.props;
    const { assignment } = this.props;
    const message = this.createMessageToContact(optOutMessageText);
    if (this.state.disabled) {
      return; // stops from multi-send
    }
    this.setState({ disabled: true });
    try {
      if (optOutMessageText.length) {
        await this.props.mutations.sendMessage(message, contact.id);
      }

      const optOut = {
        cell: contact.cell,
        assignmentId: assignment.id
      };

      await this.handleSubmitSurveys();
      await this.props.mutations.createOptOut(optOut, contact.id);
      this.props.onFinishContact(contact.id);
    } catch (err) {
      console.log("handleOptOut Error", err);
      this.handleSendMessageError(err);
      setTimeout(() => {
        this.props.onFinishContact(contact.id);
      }, 750);
    }
  };

  isContactBetweenTextingHours(contact) {
    const { campaign } = this.props;

    let timezoneData = null;

    if (
      contact.location &&
      contact.location.timezone &&
      contact.location.timezone.offset
    ) {
      const { hasDST, offset } = contact.location.timezone;

      timezoneData = { hasDST, offset };
    } else {
      const location = getContactTimezone(
        this.props.campaign,
        contact.location
      );
      if (location) {
        const timezone = location.timezone;
        if (timezone) {
          timezoneData = timezone;
        }
      }
    }

    const {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced
    } = campaign.organization;
    const config = {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced
    };

    if (campaign.overrideOrganizationTextingHours) {
      config.campaignTextingHours = {
        textingHoursStart: campaign.textingHoursStart,
        textingHoursEnd: campaign.textingHoursEnd,
        textingHoursEnforced: campaign.textingHoursEnforced,
        timezone: campaign.timezone
      };
    }

    return isBetweenTextingHours(timezoneData, config);
  }

  optOutSchema = yup.object({
    optOutMessageText: yup.string()
  });

  skipContact = () => {
    setTimeout(this.props.onFinishContact, 1500);
  };

  bulkSendMessages = async assignmentId => {
    await this.props.mutations.bulkSendMessages(assignmentId);
    this.props.refreshData();
  };

  messageSchema = yup.object({
    messageText: yup
      .string()
      .required("Can't send empty message")
      .max(window.MAX_MESSAGE_LENGTH)
  });

  render() {
    const ControlsComponent =
      /old=1/.test(document.location.search) ||
      window.DEPRECATED_TEXTERUI === "GONE_SOON"
        ? OldControls
        : Controls;
    return (
      <div {...dataTest("assignmentTexterContactFirstDiv")}>
        {this.state.disabled &&
        this.props.messageStatusFilter !== "needsMessage" ? (
          <div className={css(styles.overlay)}>
            <CircularProgress size={0.5} />
            {this.state.disabledText}
          </div>
        ) : (
          ""
        )}
        <ControlsComponent
          contact={this.props.contact}
          campaign={this.props.campaign}
          texter={this.props.texter}
          assignment={this.props.assignment}
          navigationToolbarChildren={this.props.navigationToolbarChildren}
          messageStatusFilter={this.props.messageStatusFilter}
          disabled={this.state.disabled}
          onMessageFormSubmit={this.handleMessageFormSubmit}
          onOptOut={this.handleOptOut}
          onUpdateTags={this.handleUpdateTags}
          onReleaseContacts={this.handleReleaseContacts}
          onQuestionResponseChange={this.handleQuestionResponseChange}
          onCreateCannedResponse={this.handleCreateCannedResponse}
          onExitTexter={this.props.onExitTexter}
          onEditStatus={this.handleEditStatus}
          getMessageTextFromScript={this.getMessageTextFromScript}
        />
        {this.props.contact.messageStatus === "needsMessage" &&
        window.NOT_IN_USA &&
        window.ALLOW_SEND_ALL &&
        window.BULK_SEND_CHUNK_SIZE ? (
          <BulkSendButton
            assignment={this.props.assignment}
            onFinishContact={this.props.onFinishContact}
            bulkSendMessages={this.bulkSendMessages}
            setDisabled={this.setDisabled}
          />
        ) : (
          ""
        )}
        <Snackbar
          style={inlineStyles.snackbar}
          open={!!this.state.snackbarError}
          message={this.state.snackbarError || ""}
          action={this.state.snackbarActionTitle}
          onActionClick={this.state.snackbarOnTouchTap}
        />
      </div>
    );
  }
}

AssignmentTexterContact.propTypes = {
  reviewContactid: PropTypes.string,
  contact: PropTypes.object,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  texter: PropTypes.object,
  navigationToolbarChildren: PropTypes.object,
  onFinishContact: PropTypes.func,
  router: PropTypes.object,
  mutations: PropTypes.object,
  refreshData: PropTypes.func,
  onExitTexter: PropTypes.func,
  messageStatusFilter: PropTypes.string
};

const mutations = {
  createOptOut: ownProps => (optOut, campaignContactId) => ({
    mutation: gql`
      mutation createOptOut(
        $optOut: OptOutInput!
        $campaignContactId: String!
      ) {
        createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
          id
          optOut {
            id
            createdAt
          }
        }
      }
    `,
    variables: {
      optOut,
      campaignContactId
    }
  }),
  createCannedResponse: ownProps => cannedResponse => ({
    mutation: gql`
      mutation createCannedResponse($cannedResponse: CannedResponseInput!) {
        createCannedResponse(cannedResponse: $cannedResponse) {
          id
        }
      }
    `,
    variables: { cannedResponse }
  }),
  editCampaignContactMessageStatus: ownProps => (
    messageStatus,
    campaignContactId
  ) => ({
    mutation: gql`
      mutation editCampaignContactMessageStatus(
        $messageStatus: String!
        $campaignContactId: String!
      ) {
        editCampaignContactMessageStatus(
          messageStatus: $messageStatus
          campaignContactId: $campaignContactId
        ) {
          id
          messageStatus
        }
      }
    `,
    variables: {
      messageStatus,
      campaignContactId
    }
  }),
  deleteQuestionResponses: ownProps => (
    interactionStepIds,
    campaignContactId
  ) => ({
    mutation: gql`
      mutation deleteQuestionResponses(
        $interactionStepIds: [String]
        $campaignContactId: String!
      ) {
        deleteQuestionResponses(
          interactionStepIds: $interactionStepIds
          campaignContactId: $campaignContactId
        ) {
          id
        }
      }
    `,
    variables: {
      interactionStepIds,
      campaignContactId
    }
  }),
  updateContactTags: ownProps => (tags, campaignContactId) => ({
    mutation: gql`
      mutation updateContactTags(
        $tags: [TagInput]
        $campaignContactId: String!
      ) {
        updateContactTags(tags: $tags, campaignContactId: $campaignContactId)
      }
    `,
    variables: {
      tags,
      campaignContactId
    }
  }),
  updateQuestionResponses: ownProps => (
    questionResponses,
    campaignContactId
  ) => ({
    mutation: gql`
      mutation updateQuestionResponses(
        $questionResponses: [QuestionResponseInput]
        $campaignContactId: String!
      ) {
        updateQuestionResponses(
          questionResponses: $questionResponses
          campaignContactId: $campaignContactId
        )
      }
    `,
    variables: {
      questionResponses,
      campaignContactId
    }
  }),
  sendMessage: ownProps => (message, campaignContactId) => ({
    mutation: gql`
      mutation sendMessage(
        $message: MessageInput!
        $campaignContactId: String!
      ) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
          id
          messageStatus
          messages {
            id
            createdAt
            text
            isFromContact
          }
        }
      }
    `,
    variables: {
      message,
      campaignContactId
    }
  }),
  releaseContacts: ownProps => (assignmentId, releaseConversations) => ({
    mutation: gql`
      mutation releaseContacts(
        $assignmentId: Int!
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
      assignmentId,
      releaseConversations,
      contactsFilter: {
        messageStatus: ownProps.messageStatusFilter,
        isOptedOut: false,
        validTimezone: true
      }
    }
  }),
  bulkSendMessages: ownProps => assignmentId => ({
    mutation: gql`
      mutation bulkSendMessages($assignmentId: Int!) {
        bulkSendMessages(assignmentId: $assignmentId) {
          id
        }
      }
    `,
    variables: {
      assignmentId
    }
  })
};

export const operations = { mutations };

export default loadData(operations)(withRouter(AssignmentTexterContact));
