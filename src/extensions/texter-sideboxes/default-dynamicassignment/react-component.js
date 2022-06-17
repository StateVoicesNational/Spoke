import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import GSTextField from "../../../components/forms/GSTextField";
import { dataTest } from "../../../lib/attributes";

import loadData from "../../../containers/hoc/load-data";

export const displayName = () => "Dynamic Assignment Controls";

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
    finished &&
    campaign.useDynamicAssignment &&
    assignment.hasUnassignedContactsForTexter &&
    ["needsMessage", "needsMessageOrResponse", "needsResponse"].includes(
      messageStatusFilter
    )
  ) {
    return "popup";
  }
};

export const showSummary = ({ campaign, assignment, settingsData }) =>
  campaign.useDynamicAssignment &&
  !assignment.unmessagedCount &&
  assignment.maxContacts !== 0;

const defaultDynamicAssignmentRequestMoreMessage =
  "Finished sending all your messages, and want to send more?";
const defaultDynamicAssignmentRequestMoreLabel = "Send more texts";

export class TexterSideboxClass extends React.Component {
  requestNewContacts = async () => {
    const { assignment, messageStatusFilter } = this.props;
    const didAddContacts = (await this.props.mutations.findNewCampaignContact())
      .data.findNewCampaignContact;
    console.log(
      "default-dynamicassignment:requestNewContacts added?",
      didAddContacts
    );
    if (didAddContacts && didAddContacts.found) {
      if (messageStatusFilter !== "needsMessage") {
        this.gotoInitials();
      } else {
        this.props.refreshData();
      }
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
    const nextBatchMessage =
      assignment.allContactsCount === 0
        ? "Start texting with your first batch"
        : settingsData.dynamicAssignmentRequestMoreMessage ||
          defaultDynamicAssignmentRequestMoreMessage;
    const nextBatchMoreLabel =
      assignment.allContactsCount === 0
        ? "Start texting"
        : settingsData.dynamicAssignmentRequestMoreLabel ||
          defaultDynamicAssignmentRequestMoreLabel;
    const headerStyle = messageStatusFilter ? { textAlign: "center" } : {};
    return (
      <div style={headerStyle}>
        {assignment.hasUnassignedContactsForTexter ? (
          <div>
            <h3>{nextBatchMessage}</h3>
            <Button
              color="primary"
              variant="contained"
              onClick={this.requestNewContacts}
            >
              {nextBatchMoreLabel}
            </Button>
          </div>
        ) : null}
        {messageStatusFilter === "needsMessage" && assignment.unrepliedCount ? (
          <div style={{ marginBottom: "8px", paddingLeft: "12px" }}>
            <Badge badgeContent={assignment.unrepliedCount} color="primary">
              <Button variant="contained" onClick={this.gotoReplies}>
                Go To Replies
              </Button>
            </Badge>
          </div>
        ) : null}
        {messageStatusFilter &&
        messageStatusFilter !== "needsMessage" &&
        assignment.unmessagedCount ? (
          <div style={{ marginBottom: "8px", paddingLeft: "12px" }}>
            <Badge badgeContent={assignment.unmessagedCount} color="primary">
              <Button variant="contained" onClick={this.gotoInitials}>
                Send first texts
              </Button>
            </Badge>
          </div>
        ) : null}
        {contact /*the empty list*/ ? (
          <div style={{ marginBottom: "8px" }}>
            <Button
              variant="contained"
              onClick={this.gotoTodos}
              {...dataTest("gotoTodos")}
            >
              Back To Todos
            </Button>
          </div>
        ) : null}
        {!assignment.hasUnassignedContactsForTexter &&
        !contact &&
        !assignment.unmessagedCount &&
        !assignment.unrepliedCount &&
        settingsData.dynamicAssignmentNothingToDoMessage ? (
          // assignment summary when there is nothing to do
          <div style={{ marginBottom: "8px", marginLeft: "12px" }}>
            {settingsData.dynamicAssignmentNothingToDoMessage}
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
  messageStatusFilter: type.string
};

export const mutations = {
  findNewCampaignContact: ownProps => () => ({
    mutation: gql`
      mutation findNewCampaignContact(
        $assignmentId: String!
        $numberContacts: Int!
      ) {
        findNewCampaignContact(
          assignmentId: $assignmentId
          numberContacts: $numberContacts
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
      numberContacts: ownProps.campaign.batchSize
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
  dynamicAssignmentRequestMoreLabel: yup.string(),
  dynamicAssignmentRequestMoreMessage: yup.string(),
  dynamicAssignmentNothingToDoMessage: yup.string()
});

export class AdminConfig extends React.Component {
  componentDidMount() {
    const { settingsData } = this.props;
    // set defaults
    const defaults = {};
    if (!settingsData.dynamicAssignmentRequestMoreLabel) {
      defaults.dynamicAssignmentRequestMoreLabel = defaultDynamicAssignmentRequestMoreLabel;
    }
    if (!settingsData.dynamicAssignmentRequestMoreMessage) {
      defaults.dynamicAssignmentRequestMoreMessage = defaultDynamicAssignmentRequestMoreMessage;
    }

    if (Object.values(defaults).length) {
      this.props.setDefaultsOnMount(defaults);
    }
  }

  render() {
    return (
      <div>
        <Form.Field
          as={GSTextField}
          name="dynamicAssignmentRequestMoreLabel"
          label="Request More Label"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="dynamicAssignmentRequestMoreMessage"
          label="Request More Top Message"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="dynamicAssignmentNothingToDoMessage"
          label="Summary message when there is nothing to do"
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
