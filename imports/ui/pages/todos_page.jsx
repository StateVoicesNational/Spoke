import React from 'react'
import Paper from 'material-ui/Paper'
import { List, ListItem } from 'material-ui/List'
import { Roles } from 'meteor/alanning:roles'
import { createContainer } from 'meteor/react-meteor-data'
import { displayName, todosForUser } from '../../api/users/users'
import { Messages } from '../../api/messages/messages'
import TextField from 'material-ui/TextField'
import { AppNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import Dialog from 'material-ui/Dialog'
import Check from 'material-ui/svg-icons/action/check-circle';
import { Empty } from '../components/empty'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { commonStyles } from '../components/styles'
import { AssignmentSummary } from '../components/assignment_summary'
import { AssignmentTexter } from '../../ui/components/assignment_texter'

class _TodosPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentTextingContacts: [],
    }
  }

  onStopTexting() {
    this.setState({ currentTextingContacts: [] })
  }

  summaryPageContent() {
    const { assignment } = this.props

    return (
      <AssignmentSummary
        assignment={assignment}
        contacts={assignment.contacts().fetch()}
        onStartTexting={this.onStartTexting.bind(this)}
      />
    )
  }

  onStartTexting(currentTextingAssignment, currentTextingContacts) {
    this.setState({ currentTextingAssignment, currentTextingContacts })
    console.log("on test", "currentTextingContacts")
  }

  summaryPage() {
    const { organizationId, loading, assignmentTodos} = this.props

    return (
      <AppPage
        navigation={<AppNavigation
          title="Todos"
          organizationId={organizationId}
        />}
        content={
          <div>
            {assignmentTodos.length === 0 ? <Empty
                title="You have nothing to do!"
                icon={<Check />}
              /> : (assignmentTodos.map((assignment) => (
                  <AssignmentSummary
                    assignment={assignment}
                    contacts={assignment.contacts().fetch()}
                    onStartTexting={this.onStartTexting.bind(this)}
                  />
                )))
            }
          </div>
        }
        loading={loading}
      />
    )
  }

  texterPage() {
    const { currentTextingContacts, currentTextingAssignment } = this.state
    const texter = (
      <AssignmentTexter
        assignment={currentTextingAssignment}
        contacts={currentTextingContacts}
        onStopTexting={this.onStopTexting.bind(this)}
      />
    )

    return texter
  }
  render () {
    const { currentTextingContacts } = this.state
    return currentTextingContacts.length > 0 ? this.texterPage() : this.summaryPage()
  }
}

export const TodosPage = createContainer(({ organizationId }) => {
  const handle = Meteor.subscribe('assignments.todo', organizationId)

  Messages.find({}).fetch() // FIXME should not just blindly fetch here
  console.log(todosForUser(Meteor.user(), organizationId).fetch())
  return {
    organizationId,
    assignmentTodos: Meteor.user() ? todosForUser(Meteor.user(), organizationId).fetch() : [],
    loading: !handle.ready()
  }
}, _TodosPage)

