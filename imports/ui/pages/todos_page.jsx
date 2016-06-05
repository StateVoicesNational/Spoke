import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Messages } from '../../api/messages/messages'
import { Campaigns } from '../../api/campaigns/campaigns'
import { AppNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import Check from 'material-ui/svg-icons/action/check-circle'
import { Empty } from '../components/empty'
import { AssignmentSummary } from '../components/assignment_summary'

const Todos = new Meteor.Collection('todos')

class _TodosPage extends React.Component {
  render () {
    const { organizationId, loading, results} = this.props
    return (
      <AppPage
        navigation={<AppNavigation
          title="Todos"
          organizationId={organizationId}
        />}
        content={loading ? '' : (
          <div>
            {results.length === 0 ? <Empty
                title="You have nothing to do!"
                icon={<Check />}
              /> : (results.map((result) => (
                  <AssignmentSummary
                    organizationId={organizationId}
                    unmessagedCount={result.unmessagedCount}
                    assignment={result.assignment}
                    unrepliedCount={result.unrepliedCount}
                  />
                )))
            }
          </div>
        )}
        loading={loading}
      />
    )
  }
}

export const TodosPage = createContainer(({ organizationId }) => {
  const handle = Meteor.subscribe('assignments.todo', organizationId)
  const assignmentHandle = Meteor.subscribe('assignments.todo.additional', organizationId)
  const todo = Todos.findOne(organizationId)
  let results = []
  if (todo) {
    results = todo.results
  }

  Messages.find({}).fetch() // FIXME should not just blindly fetch here
  Campaigns.find({}).fetch()

  return {
    organizationId,
    results,
    loading: !(handle.ready() && assignmentHandle.ready())
  }
}, _TodosPage)

