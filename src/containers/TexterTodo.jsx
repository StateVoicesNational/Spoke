import PropTypes from "prop-types";
import React from "react";
import AssignmentTexter from "../components/AssignmentTexter/ContactController";
import AssignmentTexterContact from "./AssignmentTexterContact";
import { withRouter } from "react-router";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";

export const contactDataFragment = `
        id
        assignmentId
        firstName
        lastName
        cell
        zip
        customFields
        optOut {
          id
        }
        questionResponseValues {
          interactionStepId
          value
        }
        location {
          city
          state
          timezone {
            offset
            hasDST
          }
        }
        messageStatus
        messages {
          id
          createdAt
          text
          isFromContact
        }
        tags {
          id
        }
`;

export const dataQueryString = `
  query getContacts(
    $assignmentId: String,
    $contactId: String,
    $organizationId: String!,
    $contactsFilter: ContactsFilter!,
    $tagGroup: String,
    $needsMessageFilter: ContactsFilter,
    $needsResponseFilter: ContactsFilter
  ) {
    currentUser {
      id
      roles(organizationId: $organizationId)
    }
    assignment(assignmentId: $assignmentId, contactId: $contactId) {
      id
      hasUnassignedContactsForTexter
      contacts(contactsFilter: $contactsFilter) {
        id
      }
      allContactsCount: contactsCount
      unmessagedCount: contactsCount(contactsFilter: $needsMessageFilter)
      unrepliedCount: contactsCount(contactsFilter: $needsResponseFilter)
      campaignCannedResponses {
        id
        title
        text
        isUserCreated
      }
      texter {
        id
        firstName
        lastName
        alias
      }
      campaign {
        id
        title
        isArchived
        useDynamicAssignment
        overrideOrganizationTextingHours
        timezone
        textingHoursStart
        textingHoursEnd
        textingHoursEnforced
        batchSize
        organization {
          id
          tags(group: $tagGroup) {
            id
            name
          }
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
          optOutMessage
        }
        customFields
        texterUIConfig {
          options
          sideboxChoices
        }
        interactionSteps {
          id
          script
          question {
            text
            answerOptions {
              value
              interactionStepId
              nextInteractionStep {
                id
                script
              }
            }
          }
        }
      }
    }
  }
`;

export const dataQuery = gql`
  ${dataQueryString}
`;

export class TexterTodo extends React.Component {
  componentWillMount() {
    const { assignment } = this.props.data;
    if (!assignment || assignment.campaign.isArchived) {
      this.props.router.push(`/app/${this.props.params.organizationId}/todos`);
    }
  }

  loadContacts = async contactIds => {
    this.loadingAssignmentContacts = true;
    const newContacts = await this.props.mutations.getAssignmentContacts(
      contactIds
    );
    this.loadingAssignmentContacts = false;
    return newContacts;
  };

  refreshData = () => {
    this.loadingNewContacts = true;
    const self = this;
    return this.props.data.refetch().then(data => {
      // TODO: hopefully get rid of self
      console.log("refreshData loadingNewContacts", this.loadingNewContacts);
      self.loadingNewContacts = false;
      return data;
    });
  };

  render() {
    const { assignment, currentUser } = this.props.data;
    const contacts = assignment ? assignment.contacts : [];
    const allContactsCount = assignment ? assignment.allContactsCount : 0;
    return (
      <AssignmentTexter
        assignment={assignment}
        currentUser={currentUser}
        reviewContactId={this.props.params.reviewContactId}
        contacts={contacts}
        allContactsCount={allContactsCount}
        refreshData={this.refreshData}
        loadContacts={this.loadContacts}
        onRefreshAssignmentContacts={this.refreshAssignmentContacts}
        organizationId={this.props.params.organizationId}
        ChildComponent={AssignmentTexterContact}
        messageStatusFilter={this.props.messageStatus}
      />
    );
  }
}

TexterTodo.propTypes = {
  messageStatus: PropTypes.string,
  params: PropTypes.object,
  data: PropTypes.object,
  mutations: PropTypes.object,
  router: PropTypes.object,
  location: PropTypes.object
};

const queries = {
  data: {
    query: dataQuery,
    options: ownProps => {
      console.log("TexterTodo ownProps", ownProps);
      return {
        variables: {
          contactsFilter: {
            messageStatus: ownProps.messageStatus,
            ...(!ownProps.params.reviewContactId && { isOptedOut: false }),
            ...(ownProps.params.reviewContactId && {
              contactId: ownProps.params.reviewContactId
            }),
            validTimezone: true
          },
          needsMessageFilter: {
            messageStatus: "needsMessage",
            isOptedOut: false,
            validTimezone: true
          },
          needsResponseFilter: {
            messageStatus: "needsResponse",
            isOptedOut: false,
            validTimezone: true
          },
          ...(ownProps.params.assignmentId && {
            assignmentId: ownProps.params.assignmentId
          }),
          ...(ownProps.params.reviewContactId && {
            contactId: ownProps.params.reviewContactId
          }),
          organizationId: ownProps.params.organizationId,
          tagGroup: "texter-tags"
        },
        fetchPolicy: "network-only"
      };
    }
  }
};

const mutations = {
  getAssignmentContacts: ownProps => (contactIds, findNew) => ({
    mutation: gql`
      mutation getAssignmentContacts($assignmentId: String, $contactIds: [String]!, $findNew: Boolean) {
        getAssignmentContacts(assignmentId: $assignmentId, contactIds: $contactIds, findNew: $findNew) {
          ${contactDataFragment}
        }
      }
    `,
    variables: {
      ...(ownProps.params.assignmentId && {
        assignmentId: ownProps.params.assignmentId
      }),
      contactIds,
      findNew: !!findNew
    }
  })
};

// exported for testing
export const operations = { queries, mutations };

export default loadData(operations)(withRouter(TexterTodo));
