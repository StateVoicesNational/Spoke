import React from 'react'
import Check from 'material-ui/svg-icons/action/check-circle'
import Empty from '../components/Empty'
import AssignmentSummary from '../components/AssignmentSummary'
import Subheader from 'material-ui/Subheader'
import { ListItem } from 'material-ui/List'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

class TexterTodoList extends React.Component {
  renderSection(group, groupKey) {
    return <div>section</div>
    const { organizationId } = this.props
    return (
      <div>
        <Subheader>{groupKey === 'active' ? '': groupKey}</Subheader>
          {
            group.map((result) => {
              const { title, description } = result.assignment.campaign

              if (groupKey === 'past') {
                return (
                  <ListItem
                    primaryText={title}
                    secondaryText={description}
                  />
                )
              } else if (groupKey === 'done') {
                return (
                  <ListItem
                    primaryText={title}
                    secondaryText={description}
                  />
                )
              } else {
                return (
                  <AssignmentSummary
                    organizationId={organizationId}
                    assignment={result.assignment}
                    unmessagedCount={result.unmessagedCount}
                    unrepliedCount={result.unrepliedCount}
                    badTimezoneCount={result.badTimezoneCount}
                  />
                )
              }
            }
          )
         }
    </div>
    )
  }

  renderTodoList(assignments) {
    const organizationId = this.props.params.organizationId
    return assignments.map((assignment) => (
      <AssignmentSummary
        organizationId={organizationId}
        key={assignment.id}
        assignment={assignment}
        unmessagedCount={assignment.unmessagedCount}
        unrepliedCount={assignment.unrepliedCount}
        badTimezoneCount={assignment.badTimezoneCount}
      />
    ))
  }

  render() {
    const todos = this.props.data.currentUser.todos
    const empty = (
      <Empty
        title="You have nothing to do!"
        icon={<Check />}
      />
    )

    return (
      <div>
        {todos.length === 0 ?
          empty :
          this.renderTodoList(todos)
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
    query: gql`query getTodos($organizationId: String!) {
      currentUser {
        id
        todos(organizationId: $organizationId) {
          id
          campaign {
            id
            title
            description
          }
          unmessagedCount
          unrepliedCount
          badTimezoneCount
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

export default loadData(TexterTodoList, { mapQueriesToProps })