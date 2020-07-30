import type from "prop-types";
import React from "react";
import yup from "yup";
import Form from "react-formal";
import Badge from "material-ui/Badge";
import RaisedButton from "material-ui/RaisedButton";
import { withRouter } from "react-router";
import gql from "graphql-tag";

import loadData from "../../../containers/hoc/load-data";
import { inlineStyles } from "../../../components/AssignmentSummary";

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
    (assignment.hasUnassignedContactsForTexter ||
      messageStatusFilter === "needsMessage") &&
    (messageStatusFilter === "needsMessage" ||
      messageStatusFilter === "needsResponse")
  ) {
    return "popup";
  }
};

export class TexterSideboxClass extends React.Component {
  requestNewContacts = async () => {
    const { assignment, messageStatusFilter } = this.props;
    const didAddContacts = (await this.props.mutations.findNewCampaignContact())
      .data.findNewCampaignContact;
    console.log("getNewContacts ?added", didAddContacts);
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
    console.log("dyaamsdmfidf", assignment.allContactsCount);
    const nextBatchMessage =
      assignment.allContactsCount === 0
        ? "Start texting with your first batch"
        : settingsData.dynamicAssignmentRequestMoreMessage ||
          "Finished sending all your messages, and want to send more?";
    const nextBatchMoreLabel =
      assignment.allContactsCount === 0
        ? "Start texting"
        : settingsData.dynamicAssignmentRequestMoreLabel ||
          "Request another batch";
    return (
      <div style={{ textAlign: "center" }}>
        {assignment.hasUnassignedContactsForTexter ? (
          <div>
            <h3>{nextBatchMessage}</h3>
            <RaisedButton
              label={nextBatchMoreLabel}
              primary
              onClick={this.requestNewContacts}
            />
          </div>
        ) : null}
        {messageStatusFilter === "needsMessage" && assignment.unrepliedCount ? (
          <div style={{ marginBottom: "8px", paddingLeft: "12px" }}>
            <Badge
              badgeStyle={{ ...inlineStyles.badge }}
              badgeContent={assignment.unrepliedCount}
              primary={true}
              secondary={false}
            >
              <RaisedButton label="Go To Replies" onClick={this.gotoReplies} />
            </Badge>
          </div>
        ) : null}
        {contact /*the empty list*/ ? (
          <div style={{ marginBottom: "8px" }}>
            <RaisedButton label="Back To Todos" onClick={this.gotoTodos} />
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
      numberContacts: ownProps.assignment.campaign.batchSize
    }
  })
};

export const TexterSidebox = loadData({ mutations })(
  withRouter(TexterSideboxClass)
);

export const adminSchema = () => ({
  dynamicAssignmentRequestMoreLabel: yup.string(),
  dynamicAssignmentRequestMoreMessage: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <Form.Field
          name="dynamicAssignmentRequestMoreLabel"
          label="Request More Label"
          fullWidth
          hintText="default: Request another batch"
        />
        <Form.Field
          name="dynamicAssignmentRequestMoreMessage"
          label="Request More Top Message"
          fullWidth
          hintText="default: Finished sending all your messages, and want to send more?"
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
