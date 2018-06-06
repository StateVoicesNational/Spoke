import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardHeader from '@material-ui/core/CardHeader';
import { StyleSheet, css } from 'aphrodite'
import loadData from '../containers/hoc/load-data'
import gql from 'graphql-tag'
import Button from '@material-ui/core/Button';
import Badge from '@material-ui/core/Badge';
import Divider from '@material-ui/core/Divider';
import moment from 'moment'
import { withRouter } from 'react-router'

const inlineStyles = {
  badge: {
    fontSize: 12,
    top: 20,
    right: 20,
    padding: '4px 2px 0px 2px',
    width: 20,
    textAlign: 'center',
    verticalAlign: 'middle',
    height: 20
  },
  pastMsgStyle: {
    backgroundColor: '#FFD700',
    fontSize: 12,
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
  },
  image: {
    position: 'absolute',
    height: '70%',
    top: '20px',
    right: '20px'
  }
})

export class AssignmentSummary extends Component {
  state = {
    badTimezoneTooltipOpen: false
  }

  goToTodos(contactsFilter, assignmentId) {
    const { organizationId, router } = this.props

    if (contactsFilter) {
      router.push(`/app/${organizationId}/todos/${assignmentId}/${contactsFilter}`)
    }
  }

  renderBadgedButton({ assignment, title, count, primary, disabled, contactsFilter, hideIfZero, style }) {
    if (count === 0 && hideIfZero) { return '' }
    if (count === 0) {
      return (
        <Button
          variant="contained"
          disabled={disabled}
          label={title}
          primary={primary && !disabled}
          onTouchTap={() => this.goToTodos(contactsFilter, assignment.id)}
        />)
    } else {
      return (<Badge
        key={title}
        badgeStyle={style || inlineStyles.badge}
        badgeContent={count || ''}
        primary={primary && !disabled}
        secondary={!primary && !disabled}
      >
        <Button
          variant="contained"
          disabled={disabled}
          label={title}
          onTouchTap={() => this.goToTodos(contactsFilter, assignment.id)}
        />
      </Badge>)
    }
  }

  render() {
    const { assignment, unmessagedCount, unrepliedCount, badTimezoneCount, totalMessagedCount, pastMessagesCount } = this.props
    const { title, description, dueBy,
            primaryColor, logoImageUrl, introHtml,
            useDynamicAssignment } = assignment.campaign

    return (
      <div className={css(styles.container)}>
        <Card
          key={assignment.id}
        >
          <CardHeader
            title={title}
            subtitle={`${description} - ${moment(dueBy).format('MMM D YYYY')}`}
            style={{ backgroundColor: primaryColor }}
            children={logoImageUrl ? <img src={logoImageUrl} className={css(styles.image)} /> : ''}
          />
          <Divider />
          <div style={{ margin: '20px' }}>
            <div dangerouslySetInnerHTML={{ __html: introHtml }} />
          </div>
          <CardActions>
            {(window.NOT_IN_USA && window.ALLOW_SEND_ALL) ? '' : this.renderBadgedButton({
              assignment,
              title: 'Send first texts',
              count: unmessagedCount,
              primary: true,
              disabled: false,
              contactsFilter: 'text',
              hideIfZero: !useDynamicAssignment
            })}
            {(window.NOT_IN_USA && window.ALLOW_SEND_ALL) ? '' : this.renderBadgedButton({
              assignment,
              title: 'Send replies',
              count: unrepliedCount,
              primary: false,
              disabled: false,
              contactsFilter: 'reply',
              hideIfZero: true
            })}
            {this.renderBadgedButton({
              assignment,
              title: 'Past Messages',
              count: pastMessagesCount,
              style: inlineStyles.pastMsgStyle,
              primary: false,
              disabled: false,
              contactsFilter: 'stale',
              hideIfZero: true
            })}
            {(window.NOT_IN_USA && window.ALLOW_SEND_ALL) ? this.renderBadgedButton({
              assignment,
              title: 'Send messages',
              primary: true,
              disabled: false,
              contactsFilter: 'all',
              count: 0,
              hideIfZero: false
            }) : ''}
            {this.renderBadgedButton({
              assignment,
              title: 'Send later',
              count: badTimezoneCount,
              primary: false,
              disabled: true,
              contactsFilter: null,
              hideIfZero: true
            })}
          </CardActions>
        </Card>
      </div>
    )
  }
}

AssignmentSummary.propTypes = {
  organizationId: PropTypes.string,
  router: PropTypes.object,
  assignment: PropTypes.object,
  unmessagedCount: PropTypes.number,
  unrepliedCount: PropTypes.number,
  badTimezoneCount: PropTypes.number,
  totalMessagedCount: PropTypes.number,
  pastMessagesCount: PropTypes.number,
  data: PropTypes.object,
  mutations: PropTypes.object
}

export default withRouter(AssignmentSummary)
