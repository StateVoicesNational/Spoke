import PropTypes from "prop-types";
import React from "react";
import ContactController from "../components/AssignmentTexter/ContactController";
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
          value
        }
`;

// Campaign data that we'll keep refreshing
// so when the admin updates the script, canned responses, etc
// they'll be refreshed, and all of this comes from a single db lookup for assignment
export const campaignQuery = gql`
  query getCampaign(
    $assignmentId: String
    $contactId: String
    $tagGroup: String
  ) {
    assignment(assignmentId: $assignmentId, contactId: $contactId) {
      id
      userCannedResponses {
        id
        title
        text
        isUserCreated
      }
      campaignCannedResponses {
        id
        title
        text
        isUserCreated
        tagIds
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
          allowSendAll
        }
        customFields
        texterUIConfig {
          options
          sideboxChoices
        }
        cannedResponses {
          id
          title
          text
          isUserCreated
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
  query getContacts(
    $assignmentId: String
    $contactId: String
    $organizationId: String!
    $contactsFilter: ContactsFilter!
    $needsMessageFilter: ContactsFilter
    $needsResponseFilter: ContactsFilter
  ) {
    currentUser {
      id
      roles(organizationId: $organizationId)
    }
    assignment(assignmentId: $assignmentId, contactId: $contactId) {
      id
      maxContacts
      hasUnassignedContactsForTexter
      contacts(contactsFilter: $contactsFilter) {
        id
      }
      allContactsCount: contactsCount
      unmessagedCount: contactsCount(contactsFilter: $needsMessageFilter)
      unrepliedCount: contactsCount(contactsFilter: $needsResponseFilter)
      texter {
        id
        firstName
        lastName
        alias
        roles(organizationId: $organizationId)
      }
    }
  }
`;

export class TexterTodo extends React.Component {
  componentWillMount() {
    const { assignment } = this.props.campaignData;
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
    return this.props.contactData.refetch().then(data => {
      // TODO: hopefully get rid of self
      console.log("refreshData loadingNewContacts", this.loadingNewContacts);
      self.loadingNewContacts = false;
      return data;
    });
  };

  render() {
    const { assignment, currentUser } = this.props.contactData;
    if (!this.props.campaignData.assignment) {
      return null;
    }
    const {
      assignment: { campaign }
    } = this.props.campaignData;
    const contacts = assignment ? assignment.contacts : [];
    const allContactsCount = assignment ? assignment.allContactsCount : 0;
    return (
      <ContactController
        assignment={assignment}
        campaign={campaign}
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
  contactData: PropTypes.object,
  campaignData: PropTypes.object,
  mutations: PropTypes.object,
  router: PropTypes.object,
  location: PropTypes.object
};

const queries = {
  contactData: {
    query: dataQuery,
    options: ownProps => {
      console.log("TexterTodo ownProps", ownProps);
      // FUTURE: based on ?review=1 in location.search
      //         exclude isOptedOut: false, validTimezone: true
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
  },
  campaignData: {
    query: campaignQuery,
    options: ownProps => ({
      variables: {
        ...(ownProps.params.assignmentId && {
          assignmentId: ownProps.params.assignmentId
        }),
        ...(ownProps.params.reviewContactId && {
          contactId: ownProps.params.reviewContactId
        }),
        tagGroup: "texter-tags"
      },
      fetchPolicy: "network-only",
      pollInterval: 20000
    })
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
