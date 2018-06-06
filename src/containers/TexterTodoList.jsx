import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

import loadData from './hoc/load-data'
import Empty from '../components/Empty'
import AssignmentSummary from '../components/AssignmentSummary'

class TexterTodoList extends React.Component {
  renderTodoList(assignments) {
    const organizationId = this.props.params.organizationId
    return assignments
      .sort((x, y) => ((x.unmessagedCount + x.unrepliedCount) > (y.unmessagedCount + y.unrepliedCount) ? -1 : 1))
      .map((assignment) => {
        if (assignment.unmessagedCount > 0 || assignment.unrepliedCount > 0 || assignment.badTimezoneCount > 0 || assignment.campaign.useDynamicAssignment || assignment.pastMessagesCount > 0) {
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
            />
          )
        }
        return null
      }).filter((ele) => ele !== null)
  }
  componentDidMount() {
    this.props.data.refetch()
    // re-asserts polling after manual refresh
    // this.props.data.startPolling(5000)
  }

  termsAgreed() {
    const { data, router } = this.props
    if (window.TERMS_REQUIRE && !data.currentUser.terms) {
      router.push(`/terms?next=${this.props.location.pathname}`)
    }
  }

  render() {
    this.termsAgreed()
    const todos = this.props.data.currentUser.todos
    const renderedTodos = this.renderTodoList(todos)

    const empty = (
      <Empty
        title='You have nothing to do!'
        icon={<CheckCircleIcon />}
      />
    )

    return (
      <div>
        {renderedTodos.length === 0 ?
          empty : renderedTodos
        }
      </div>
    )
  }
}

TexterTodoList.propTypes = {
  organizationId: PropTypes.string,
  params: PropTypes.object,
  data: PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getTodos($organizationId: String!, $needsMessageFilter: ContactsFilter, $needsResponseFilter: ContactsFilter, $badTimezoneFilter: ContactsFilter, $completedConvosFilter: ContactsFilter, $pastMessagesFilter: ContactsFilter) {
      currentUser {
        id
        terms
        todos(organizationId: $organizationId) {
          id
          campaign {
            id
            title
            description
            useDynamicAssignment
            hasUnassignedContacts
            introHtml
            primaryColor
            logoImageUrl
          }
          unmessagedCount: contactsCount(contactsFilter: $needsMessageFilter)
          unrepliedCount: contactsCount(contactsFilter: $needsResponseFilter)
          badTimezoneCount: contactsCount(contactsFilter: $badTimezoneFilter)
          totalMessagedCount: contactsCount(contactsFilter: $completedConvosFilter)
          pastMessagesCount: contactsCount(contactsFilter: $pastMessagesFilter)
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      needsMessageFilter: {
        messageStatus: 'needsMessage',
        isOptedOut: false,
        validTimezone: true
      },
      needsResponseFilter: {
        messageStatus: 'needsResponse',
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
        messageStatus: 'messaged'
      },
      pastMessagesFilter: {
        messageStatus: 'convo',
        isOptedOut: false,
        validTimezone: true
      }
    }
  }
})

export default loadData(withRouter(TexterTodoList), { mapQueriesToProps })
