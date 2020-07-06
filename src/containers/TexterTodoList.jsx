import PropTypes from "prop-types";
import React from "react";
import Check from "material-ui/svg-icons/action/check-circle";
import Empty from "../components/Empty";
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
          assignment.unmessagedCount > 0 ||
          assignment.unrepliedCount > 0 ||
          assignment.badTimezoneCount > 0 ||
          assignment.campaign.useDynamicAssignment ||
          assignment.pastMessagesCount > 0 ||
          assignment.skippedMessagesCount > 0
        ) {
          return (
            <AssignmentSummary
              organizationId={organizationId}
              key={assignment.id}
              assignment={assignment}
              unmessagedCount={assignment.unmessagedCount}
              unrepliedCount={assignment.unrepliedCount}
              badTimezoneCount={assignment.badTimezoneCount}
              totalMessagedCount={assignment.totalMessagedCount}
              pastMessagesCount={assignment.pastMessagesCount}
              skippedMessagesCount={assignment.skippedMessagesCount}
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
    if (this.props.data.currentUser.cacheable && !this.state.polling) {
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
    if (window.TERMS_REQUIRE && !data.currentUser.terms) {
      router.push(`/terms?next=${this.props.location.pathname}`);
    }
  }

  profileComplete() {
    const { data, router } = this.props;
    if (!data.currentUser.profileComplete) {
      const orgId = this.props.params.organizationId;;
      const userId = data.currentUser.id;
      const next = this.props.location.pathname;
      router.push(`/app/${orgId}/account/${userId}?next=${next}&fieldsNeeded=1`);
    }
  }

  render() {
    this.termsAgreed();
    this.profileComplete();
    const todos = this.props.data.currentUser.todos;
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
    $organizationId: String!
    $needsMessageFilter: ContactsFilter
    $needsResponseFilter: ContactsFilter
    $badTimezoneFilter: ContactsFilter
    $completedConvosFilter: ContactsFilter
    $pastMessagesFilter: ContactsFilter
    $skippedMessagesFilter: ContactsFilter
  ) {
    currentUser {
      id
      terms
      profileComplete(organizationId: $organizationId)
      cacheable
      todos(organizationId: $organizationId) {
        id
        campaign {
          id
          title
          description
          batchSize
          useDynamicAssignment
          hasUnassignedContactsForTexter
          introHtml
          primaryColor
          logoImageUrl
        }
        maxContacts
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

const queries = {
  data: {
    query: dataQuery,
    options: ownProps => ({
      variables: {
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

export default loadData({ queries })(withRouter(TexterTodoList));
