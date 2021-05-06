import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import { withRouter } from "react-router";
import gql from "graphql-tag";

import Button from "@material-ui/core/Button";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import GSTextField from "../../../components/forms/GSTextField";
import loadData from "../../../containers/hoc/load-data";

export const displayName = () => "Take conversations";

export const showSidebox = ({ contact, currentUser, settingsData }) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  if (
    // TODO: vetted_texter role + in ?replies?
    // + settingsData.takeConversationsBatchType
    !contact &&
    currentUser.roles.indexOf("VETTED_TEXTER") >= 0 &&
    settingsData.takeConversationsBatchSize != 0
  ) {
    return true;
  }
};

export const showSummary = ({ texter, settingsData }) =>
  texter.roles &&
  texter.roles.indexOf("VETTED_TEXTER") >= 0 &&
  settingsData.takeConversationsBatchSize != 0;

export class TexterSideboxClass extends React.Component {
  requestNewContacts = async () => {
    const didAddContacts = (await this.props.mutations.findNewCampaignContact())
      .data.findNewCampaignContact;
    console.log(
      "take-conversations:requestNewContacts added?",
      didAddContacts,
      this.props.settingsData.takeConversationsBatchType
    );
    if (didAddContacts && didAddContacts.found) {
      this.props.refreshData();
    }
  };

  gotoInitials = () => {
    const { campaign, assignment } = this.props;
    this.props.router.push(
      `/app/${campaign.organization.id}/todos/${assignment.id}/text`
    );
  };

  gotoReplies = () => {
    const { campaign, assignment } = this.props;
    this.props.router.push(
      `/app/${campaign.organization.id}/todos/${assignment.id}/reply`
    );
  };

  gotoTodos = () => {
    const { campaign } = this.props;
    this.props.router.push(`/app/${campaign.organization.id}/todos`);
  };

  render() {
    // request new batch (only if )
    // if new messageStatusFilter==needsResponse, then we should redirect to needsMessage
    //    so maybe just *always*
    // goto replies link: when finished and in needsMessage but NOT hasUnassignedContactsForTexter
    // return to Todos (only if in contact finish view)
    const {
      campaign,
      assignment,
      contact,
      settingsData,
      messageStatusFilter
    } = this.props;
    // need to see whether they have already texted anyone and if there are replies
    const headerStyle = messageStatusFilter ? { textAlign: "center" } : {};
    const batchSize =
      settingsData.takeConversationsBatchSize || campaign.batchSize;
    return (
      <div style={headerStyle}>
        <div>
          <h3>Take Conversations</h3>
          <Button
            variant="contained"
            color="primary"
            onClick={this.requestNewContacts}
          >
            Take a batch of {batchSize} conversations
          </Button>
        </div>
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
  messageStatusFilter: type.string
};

export const mutations = {
  findNewCampaignContact: ownProps => batchType => ({
    mutation: gql`
      mutation findNewCampaignContact(
        $assignmentId: String!
        $numberContacts: Int!
        $batchType: String
      ) {
        findNewCampaignContact(
          assignmentId: $assignmentId
          numberContacts: $numberContacts
          batchType: $batchType
        ) {
          found
          assignment {
            id
            hasUnassignedContactsForTexter
          }
        }
      }
    `,
    variables: {
      assignmentId: ownProps.assignment.id,
      numberContacts: ownProps.settingsData.takeConversationsBatchSize || 20,
      batchType:
        batchType ||
        ownProps.settingsData.takeConversationsBatchType ||
        "vetted-takeconversations"
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
  takeConversationsBatchType: yup.string(),
  takeConversationsBatchSize: yup.number().integer()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <p>
          Batch Type needs to be an enabled Dynamic Assignment Batches plugin
          (enable vetted-takeconversations with Ctrl-selecting it as a second
          option in the campaign Dynamic Assignment panel)
        </p>
        <Form.Field
          as={GSTextField}
          name="takeConversationsBatchType"
          label="Batch Type"
          fullWidth
          hintText=""
          value={
            this.props.settingsData.takeConversationsBatchType ||
            "vetted-takeconversations"
          }
        />
        <p>If batchsize is set to 0 it will stop showing this side panel</p>
        <Form.Field
          as={GSTextField}
          name="takeConversationsBatchSize"
          label="Batch size (number) to take conversations button"
          fullWidth
          hintText=""
          value={this.props.settingsData.takeConversationsBatchSize || 20}
        />
        <p>
          Outbound Unassignment (only works if message handler
          "outbound-unassign" is enabled) means after initial text messages are
          sent, the conversation is automatically unassigned from the initial
          texter. With Take Conversations enabled, then a set of Vetted Texters
          can take replies. This splits up initial text senders from texters
          that reply.
        </p>
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={
                this.props.settingsData.takeConversationsOutboundUnassign ||
                false
              }
              onChange={event => {
                this.props.onToggle(
                  "takeConversationsOutboundUnassign",
                  event.target.checked
                );
              }}
            />
          }
          label="Enable initial outbound unassign"
          labelPlacement="start"
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
