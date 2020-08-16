import PropTypes from "prop-types";
import React from "react";
import Check from "material-ui/svg-icons/action/check-circle";
import Empty from "../components/Empty";
import LoadingIndicator from "../components/LoadingIndicator";
import AssignmentSummary from "../components/AssignmentSummary";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";

class TexterTodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { polling: null };
  }

  renderTodoList(assignments) {
    const organizationId = this.props.params.organizationId;
    return assignments
      .sort((x, y) => {
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
              organizationId={organizationId}
              key={assignment.id}
              assignment={assignment}
              texter={this.props.data.user}
            />
          );
        }
        return null;
      })
      .filter(ele => ele !== null);
  }
  componentDidMount() {
    this.props.data.refetch();
    // stopPolling is broken (at least in currently used version), so we roll our own so we can unmount correctly
    if (
      this.props.data &&
      this.props.data.user &&
      this.props.data.user.cacheable &&
      !this.state.polling
    ) {
      const self = this;
      this.setState({
        polling: setInterval(() => {
          self.props.data.refetch();
        }, 5000)
      });
    }
  }

  componentWillUnmount() {
    if (this.state.polling) {
      clearInterval(this.state.polling);
      this.setState({ polling: null });
    }
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

    const empty = <Empty title="You have nothing to do!" icon={<Check />} />;

    return <div>{renderedTodos.length === 0 ? empty : renderedTodos}</div>;
  }
}

TexterTodoList.propTypes = {
  organizationId: PropTypes.string,
  params: PropTypes.object,
  data: PropTypes.object
};

export const dataQuery = gql`
  query getTodos(
    $userId: Int
    $organizationId: String!
    $needsMessageFilter: ContactsFilter
    $needsResponseFilter: ContactsFilter
    $badTimezoneFilter: ContactsFilter
    $completedConvosFilter: ContactsFilter
    $pastMessagesFilter: ContactsFilter
    $skippedMessagesFilter: ContactsFilter
  ) {
    user(organizationId: $organizationId, userId: $userId) {
      id
      terms
      profileComplete(organizationId: $organizationId)
      cacheable
      todos(organizationId: $organizationId) {
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
          texterUIConfig {
            options
            sideboxChoices
          }
          organization {
            id
          }
        }
        allContactsCount: contactsCount
        unmessagedCount: contactsCount(contactsFilter: $needsMessageFilter)
        unrepliedCount: contactsCount(contactsFilter: $needsResponseFilter)
        badTimezoneCount: contactsCount(contactsFilter: $badTimezoneFilter)
        totalMessagedCount: contactsCount(
          contactsFilter: $completedConvosFilter
        )
        pastMessagesCount: contactsCount(contactsFilter: $pastMessagesFilter)
        skippedMessagesCount: contactsCount(
          contactsFilter: $skippedMessagesFilter
        )
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
        badTimezoneFilter: {
          isOptedOut: false,
          validTimezone: false
        },
        completedConvosFilter: {
          isOptedOut: false,
          validTimezone: true,
          messageStatus: "messaged"
        },
        pastMessagesFilter: {
          messageStatus: "convo",
          isOptedOut: false,
          validTimezone: true
        },
        skippedMessagesFilter: {
          messageStatus: "closed",
          isOptedOut: false,
          validTimezone: true
        }
      }
    })
  }
};

export default loadData({ queries, mutations })(withRouter(TexterTodoList));
