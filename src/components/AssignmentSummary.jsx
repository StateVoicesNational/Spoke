import React, { Component } from 'react'
import { Card, CardActions, CardTitle } from 'material-ui/Card'
import { StyleSheet, css } from 'aphrodite'
import FlatButton from 'material-ui/FlatButton'
import Badge from 'material-ui/Badge'
import moment from 'moment'
import Divider from 'material-ui/Divider'
import { withRouter } from 'react-router'

const inlineStyles = {
  badge: {
    fontSize: 9,
    top: 20,
    right: 20,
    padding: '4px 2px 0px 2px',
    width: 20,
    textAlign: 'center',
    verticalAlign: 'middle',
    height: 20
  }
}

const styles = StyleSheet.create({
  container: {
    margin: '20px 0'
  }
})

class AssignmentSummary extends Component {
  state = {
    badTimezoneTooltipOpen: false
  }

  goToTodos(contactsFilter, assignmentId) {
    const { organizationId, router } = this.props

    if (contactsFilter) {
      router.push(`/app/${organizationId}/todos/${assignmentId}/${contactsFilter}`)
    }
  }
  renderBadgedButton({ assignment, title, count, primary, disabled, contactsFilter }) {
    return (count === 0 ? '' :
      <Badge
        key={title}
        badgeStyle={inlineStyles.badge}
        badgeContent={count}
        primary={primary && !disabled}
        secondary={!primary && !disabled}
      >
        <FlatButton
          disabled={disabled}
          label={title}
          onTouchTap={() => this.goToTodos(contactsFilter, assignment.id)}
        />
      </Badge>
    )
  }

  render() {
    const { assignment, unmessagedCount, unrepliedCount, badTimezoneCount } = this.props
    const { title, description, dueBy } = assignment.campaign
    return (
      <div className={css(styles.container)}>
        <Card
          key={assignment.id}
        >
          <CardTitle
            title={title}
            subtitle={`${description} - ${moment(dueBy).format('MMM D YYYY')}`}
          />
          <Divider />
          <CardActions>
            {this.renderBadgedButton({
              assignment,
              title: 'Send first texts',
              count: unmessagedCount,
              primary: true,
              disabled: false,
              contactsFilter: 'text'
            })}
            {this.renderBadgedButton({
              assignment,
              title: 'Send replies',
              count: unrepliedCount,
              primary: false,
              disabled: false,
              contactsFilter: 'reply'
            })}
            {this.renderBadgedButton({
              assignment,
              title: "Send later (too early or late for some contacts)",
              count: badTimezoneCount,
              primary: false,
              disabled: true,
              contactsFilter: null,
            })}
          </CardActions>
        </Card>
      </div>
    )
  }
}

AssignmentSummary.propTypes = {
  organizationId: React.PropTypes.string,
  router: React.PropTypes.object,
  assignment: React.PropTypes.object,
  unmessagedCount: React.PropTypes.number,
  unrepliedCount: React.PropTypes.number,
  badTimezoneCount: React.PropTypes.number
}

export default withRouter(AssignmentSummary)
