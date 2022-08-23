import PropTypes from "prop-types";
import React from "react";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import Empty from "../components/Empty";
import LoadingIndicator from "../components/LoadingIndicator";
import AssignmentSummary from "../components/AssignmentSummary";
import Snackbar from "@material-ui/core/Snackbar";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";

let refreshOnReturn = false;

// We want to back off on notifications both because if they don't leave the page
// then there's no point in polling more frequently, and also to stop annoying
// someone that's clearly ignoring it.
// So 30sec, 2min, 8min, 32min, 2 hours -- so 4x each time
const NOTIFICATION_START_DELAY = 7500;
const NOTIFICATION_MAX_DELAY = 7680000; // 2.13 hours
let notificationPollDelay = NOTIFICATION_START_DELAY;

class TexterTodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillUpdate(nextProps, nextState) {
    const notifications =
      nextProps.notifications && nextProps.notifications.user.notifications;
    if (notifications && notifications.length) {
      // Note, we are changing notification polling times only when there's a notification,
      // otherwise keep polling at the same rate.
      notificationPollDelay = Math.min(
        4 * notificationPollDelay,
        NOTIFICATION_MAX_DELAY
      );
      this.props.notifications.stopPolling();
      this.props.notifications.startPolling(notificationPollDelay);
      // move the result to state
      nextProps.notifications.user.notifications = [];
      // FUTURE: maybe append for a set of assignmentIds to display them
      nextState.notifications = notifications;
    }
  }

  componentDidMount() {
    if (refreshOnReturn) {
      this.props.data.refetch();
    }
    // reset notification state
    notificationPollDelay = NOTIFICATION_START_DELAY;
  }

  componentWillUnmount() {
    // not state: maintain this forever after
    refreshOnReturn = true;
  }

  renderTodoList(assignments) {
    return assignments
      .sort((x, y) => {
        // Sort with feedback at the top, and then based on Text assignment size
        const xHasFeedback =
          x.feedback && x.feedback.sweepComplete && !x.feedback.isAcknowledged;
        const yHasFeedback =
          y.feedback && y.feedback.sweepComplete && !y.feedback.isAcknowledged;
        if (xHasFeedback && !yHasFeedback) {
          return -1;
        }
        if (yHasFeedback && !xHasFeedback) {
          return 1;
        }
        const xToText = x.unmessagedCount + x.unrepliedCount;
        const yToText = y.unmessagedCount + y.unrepliedCount;
        if (xToText === yToText) {
          return Number(y.id) - Number(x.id);
        }
        return xToText > yToText ? -1 : 1;
      })
      .map(assignment => {
        if (
          assignment.allContactsCount > 0 ||
          assignment.campaign.useDynamicAssignment
        ) {
          return (
            <AssignmentSummary
              organizationId={assignment.campaign.organization.id}
              key={assignment.id}
              assignment={assignment}
              texter={this.props.data.user}
              refreshData={() => this.props.data.refetch()}
            />
          );
        }
        return null;
      })
      .filter(ele => ele !== null);
  }

  termsAgreed() {
    const { data, router } = this.props;
    if (window.TERMS_REQUIRE && !data.user.terms) {
      router.push(`/terms?next=${this.props.location.pathname}`);
    }
  }

  profileComplete() {
    const { data, router } = this.props;
    if (!data.user.profileComplete) {
      const orgId = this.props.params.organizationId;
      const userId = data.user.id;
      const next = this.props.location.pathname;
      router.push(
        `/app/${orgId}/account/${userId}?next=${next}&fieldsNeeded=1`
      );
    }
  }

  render() {
    const { data } = this.props;
    if (!data || !data.user) {
      return <LoadingIndicator />;
    }
    this.termsAgreed();
    this.profileComplete();
    const todos = data.user.todos;
    const renderedTodos = this.renderTodoList(todos);

    const empty = (
      <Empty title="You have nothing to do!" icon={<CheckCircleIcon />} />
    );

    return (
      <div>
        <Snackbar
          open={Boolean(this.state.notifications)}
          message={"Some campaigns have replies for you to respond to!"}
          onClose={() => {
            this.setState({ notifications: false });
          }}
        />
        {renderedTodos.length === 0 ? empty : renderedTodos}
      </div>
    );
  }
}

TexterTodoList.propTypes = {
  organizationId: PropTypes.string,
  params: PropTypes.object,
  data: PropTypes.object
};

const assignmentQueryData = `
        id
        hasUnassignedContactsForTexter
        campaign {
          id
          title
          description
          batchSize
          useDynamicAssignment
          introHtml
          primaryColor
          logoImageUrl
          isArchived
          texterUIConfig {
            options
            sideboxChoices
          }
          organization {
            allowSendAll
            id
          }
          serviceManagers {
            name
            data
          }
        }
        feedback {
          isAcknowledged
          createdBy {
            name
          }
          message
          issueCounts
          skillCounts
          sweepComplete
        }
        allContactsCount: contactsCount
        unmessagedCount: contactsCount(contactsFilter: {
          messageStatus: "needsMessage"
          isOptedOut: false
          validTimezone: true
        })
        unrepliedCount: contactsCount(contactsFilter: {
          messageStatus: "needsResponse"
          isOptedOut: false
          validTimezone: true
        })
        badTimezoneCount: contactsCount(contactsFilter: {
          isOptedOut: false
          validTimezone: false
        })
        totalMessagedCount: contactsCount(
          contactsFilter: {
          isOptedOut: false
          validTimezone: true
          messageStatus: "messaged"
        }
        )
        pastMessagesCount: contactsCount(contactsFilter: {
          messageStatus: "convo"
          isOptedOut: false
          validTimezone: true
        })
        skippedMessagesCount: contactsCount(
          contactsFilter: {
           messageStatus: "closed"
           isOptedOut: false
           validTimezone: true
          }
        )
`;

export const dataQuery = gql`
  query getTodos(
    $userId: Int
    $organizationId: String!
    $todosOrg: String
  ) {
    user(organizationId: $organizationId, userId: $userId) {
      id
      terms
      profileComplete(organizationId: $organizationId)
      notifiable
      roles(organizationId: $organizationId)
      todos(organizationId: $todosOrg) {
         ${assignmentQueryData}
      }
    }
  }
`;

const mutations = {
  findNewCampaignContact: ownProps => (assignmentId, numberContacts) => ({
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
        }
      }
    `,
    variables: {
      assignmentId,
      numberContacts
    }
  })
};

const queries = {
  data: {
    query: dataQuery,
    options: ownProps => ({
      variables: {
        userId: ownProps.params.userId || null,
        organizationId: ownProps.params.organizationId,
        todosOrg:
          ownProps.location.query["org"] == "all" ||
          !ownProps.params.organizationId
            ? null
            : ownProps.params.organizationId
      }
    })
  },
  notifications: {
    query: gql`
      query getNotifications(
        $userId: Int
        $organizationId: String!
      ) {
        user(organizationId: $organizationId, userId: $userId) {
          id
          notifications {
            ${assignmentQueryData}
          }
        }
      }
    `,
    options: ownProps => {
      const tryNotifications =
        ownProps.data.user &&
        ownProps.data.user.notifiable &&
        ownProps.data.user.todos.length &&
        // some messages have been sent, so there's a possibility of replies
        ownProps.data.user.todos.find(
          a => a.unmessagedCount !== a.allContactsCount
        );
      return {
        variables: {
          userId: ownProps.params.userId || null,
          organizationId: ownProps.params.organizationId
        },
        fetchPolicy: "network-only",
        pollInterval: tryNotifications ? NOTIFICATION_START_DELAY : 0
      };
    }
  }
};

export default loadData({ queries, mutations })(withRouter(TexterTodoList));
