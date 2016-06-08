import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Messages } from '../../api/messages/messages'
import { Campaigns } from '../../api/campaigns/campaigns'
import { AppNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import Check from 'material-ui/svg-icons/action/check-circle'
import { Empty } from '../components/empty'
import { AssignmentSummary } from '../components/assignment_summary'
import { moment } from 'meteor/momentjs:moment'
import Subheader from 'material-ui/Subheader'
import { ListItem } from 'material-ui/List'
const Todos = new Meteor.Collection('todos')

class _TodosPage extends React.Component {
  render () {
    const { organizationId, loading, results} = this.props

    const groupedByPast = _.groupBy(results, (result) =>  moment(result.assignment.dueBy).isBefore(moment()))

    // const groupedResults = _.groupBy(results, (result) => [
    //   // (result.unmessagedCount + result.unrepliedCount) > 0,  //hasTodos
    //   moment(result.dueBy).diff(moment()) < 0 //isPast
    // ])

    const empty = (
      <Empty
        title="You have nothing to do!"
        icon={<Check />}
      />
    )

    const section = (group, isPast) => (
      <div>
        <Subheader>{isPast ? 'Past' : 'Now'}</Subheader>
          {
            group.map((result) => {
              const { title, description } = Campaigns.findOne(result.assignment.campaignId)

              return isPast ? (
                <ListItem
                  primaryText={title}
                  secondaryText={description}
                />
              ) : (
                <AssignmentSummary
                  organizationId={organizationId}
                  unmessagedCount={result.unmessagedCount}
                  assignment={result.assignment}
                  unrepliedCount={result.unrepliedCount}
                />
              )
            }
          )
        }
      </div>

    )

    console.log(groupedByPast)
    const content = results.length > 0 ? (
      [false, true].map((isPast) => {
        const group = _.has(groupedByPast, isPast) ? groupedByPast[isPast] : []
        return group.length > 0 ? section(group, isPast) : ''
      })) : empty



    return (
      <AppPage
        navigation={<AppNavigation
          title="Todos"
          organizationId={organizationId}
        />}
        content={loading ? '' : content }
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

