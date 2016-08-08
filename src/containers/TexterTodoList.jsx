import React from 'react'
import Check from 'material-ui/svg-icons/action/check-circle'
import Empty from '../components/Empty'
import AssignmentSummary from '../components/AssignmentSummary'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

class TexterTodoList extends React.Component {
  renderTodoList(assignments) {
    const organizationId = this.props.params.organizationId
    return assignments.map((assignment) => {
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

  render() {
    const { organization } = this.props.data
    const balanceAmount = organization.billingDetails.balanceAmount
    const { amountPerMessage } = organization.plan
    const accountBalanceIsLow = balanceAmount < amountPerMessage

    const todos = this.props.data.currentUser.todos
    const empty = (
      <Empty
        title='You have nothing to do!'
        icon={<Check />}
      />
    )

    return accountBalanceIsLow ? (
      <div>
        There's not enough credit to send texts. Contact the organizer.
      </div>
    ) : (
      <div>
        {renderedTodos.length === 0 ?
          empty : renderedTodos
        }
      </div>
    )
  }
}

TexterTodoList.propTypes = {
  organizationId: React.PropTypes.string,
  params: React.PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getTodos($organizationId: String!, $needsMessageString: String, $needsResponseString: String, $badTimezoneString: String) {
      organization(id: $organizationId) {
        id
        billingDetails {
          balanceAmount
        }
        plan {
          id
          amountPerMessage
        }
      }
      currentUser {
        id
        todos(organizationId: $organizationId) {
          id
          campaign {
            id
            title
            description
          }
          unmessagedCount: contactsCount(contactFilter: $needsMessageFilter)
          unrepliedCount: contactsCount(contactFilter: $needsResponseFilter)
          badTimezoneCount: contactsCount(contactFilter: $badTimezoneFilter)
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      needsMessageFilter: { messageStatus: 'needsMessage' },
      needsResponseFilter: { messageStatus: 'needsResponse' },
      badTimezoneFilter: { validTimezone: false }
    },
    forceFetch: true
  }
})

export default loadData(TexterTodoList, { mapQueriesToProps })
