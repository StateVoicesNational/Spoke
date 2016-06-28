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
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import ContentFilter from 'material-ui/svg-icons/content/filter-list';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';

const styles = {
  toolbar: {backgroundColor: 'white'}
}

const Todos = new Meteor.Collection('todos')

class _TodosPage extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      showInactive: false
    }
  }

  handleChange(event, value) {
    this.setState({ showInactive: value});
  }

  filteredSections() {
    const { showInactive } = this.state
    let filters
    if (showInactive) {
      filters = ['done', 'past']

    } else {
      filters = ['active']
    }

    return filters
  }

  render () {
    const { organizationId, loading, results} = this.props
    const groupedResults = _.groupBy(results, (result) =>  {
      if (moment(result.assignment.dueBy).isBefore(moment())) {
        return 'past'
      } else if ((result.unmessagedCount + result.unrepliedCount + result.badTimezoneCount) > 0) {
        return 'active'
      } else {
        return 'done'
      }
    })

    const empty = (
      <Empty
        title="You have nothing to do!"
        icon={<Check />}
      />
    )

    const section = (group, groupKey) => (
      <div>
        <Subheader>{groupKey === 'active' ? '': groupKey}</Subheader>
          {
            group.map((result) => {
              const { title, description } = Campaigns.findOne(result.assignment.campaignId)

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


    const content = !loading && results.length > 0 ? (
        <div>
          <Toolbar style={styles.toolbar}>
            <ToolbarGroup firstChild={true}>
            </ToolbarGroup>
            <ToolbarGroup lastChild>
              <IconMenu
                iconButtonElement={<IconButton><ContentFilter /></IconButton>}
                onChange={this.handleChange}
                value={this.state.showInactive}
              >
              <MenuItem value={false} primaryText="To-dos only" />
              <MenuItem value={true} primaryText="Done & past" />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>

          {
            this.filteredSections().map((groupKey) => {
              const group = _.has(groupedResults, groupKey) ? groupedResults[groupKey] : []
              return group.length > 0 ? section(group, groupKey) : (groupKey === 'active' ? empty : '')
            })
          }
      </div>
      ) : empty

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

