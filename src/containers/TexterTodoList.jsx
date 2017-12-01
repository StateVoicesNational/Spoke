import PropTypes from 'prop-types';
import React from 'react'
import Check from 'material-ui/svg-icons/action/check-circle'
import Empty from '../components/Empty'
import AssignmentSummary from '../components/AssignmentSummary'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'

class TexterTodoList extends React.Component {
  renderTodoList(assignments) {
    const organizationId = this.props.params.organizationId
    return assignments
      .sort((x, y) => ((x.unmessagedCount + x.unrepliedCount) > (y.unmessagedCount + y.unrepliedCount) ? -1 : 1))
      .map((assignment) => {
        if (assignment.unmessagedCount > 0 || assignment.unrepliedCount > 0 || assignment.badTimezoneCount > 0) {
          return (
            <AssignmentSummary
              organizationId={organizationId}
              key={assignment.id}
              assignment={assignment}
              unmessagedCount={assignment.unmessagedCount}
              unrepliedCount={assignment.unrepliedCount}
              badTimezoneCount={assignment.badTimezoneCount}
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

  render() {
    const todos = this.props.data.currentUser.todos
    const renderedTodos = this.renderTodoList(todos)

    const empty = (
      <Empty
        title='You have nothing to do!'
        icon={<Check />}
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

const query = graphql(gql`
  query getTodos($organizationId: String!, $needsMessageFilter: ContactsFilter, $needsResponseFilter: ContactsFilter, $badTimezoneFilter: ContactsFilter) {
    currentUser {
      id
      todos(organizationId: $organizationId) {
        id
        campaign {
          id
          title
          description
        }
        unmessagedCount: contactsCount(contactsFilter: $needsMessageFilter)
        unrepliedCount: contactsCount(contactsFilter: $needsResponseFilter)
        badTimezoneCount: contactsCount(contactsFilter: $badTimezoneFilter)
      }
    }
  }
`, {
  options: ({ params: { organizationId } }) => ({
    variables: {
      organizationId,
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
      }
    }
  })
})

export default compose(query, loadData)(TexterTodoList)
