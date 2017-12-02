import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Card, CardActions, CardTitle } from 'material-ui/Card'
import { StyleSheet, css } from 'aphrodite'
import loadData from '../containers/hoc/load-data'
import { applyScript } from '../lib/scripts'
import gql from 'graphql-tag'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'
import Badge from 'material-ui/Badge'
import moment from 'moment'
import Divider from 'material-ui/Divider'
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

  renderBadgedButton({ assignment, title, count, primary, disabled, contactsFilter, hideIfZero }) {
    if (count === 0 && hideIfZero) { return '' }
    if (count === 0) {
      return (
        <RaisedButton
          disabled={disabled}
          label={title}
          primary={primary && !disabled}
          onTouchTap={() => this.goToTodos(contactsFilter, assignment.id)}
        />)
    } else {
      return (<Badge
        key={title}
        badgeStyle={inlineStyles.badge}
        badgeContent={count}
        primary={primary && !disabled}
        secondary={!primary && !disabled}
      >
        <RaisedButton
          disabled={disabled}
          label={title}
          onTouchTap={() => this.goToTodos(contactsFilter, assignment.id)}
        />
      </Badge>)
    }
  }

  render() {
    const { assignment, unmessagedCount, unrepliedCount, badTimezoneCount } = this.props
    const { title, description, dueBy,
            primaryColor, logoImageUrl, introHtml,
            useDynamicAssignment } = assignment.campaign
    const actions = [
      <FlatButton
        label='No'
        primary
        onClick={this.handleClose}
      />,
      <FlatButton
        label='Yes'
        primary
        onClick={this.sendMessages}
      />
    ]
    return (
      <div className={css(styles.container)}>
        <Card
          key={assignment.id}
        >
          <CardTitle
            title={title}
            subtitle={`${description} - ${moment(dueBy).format('MMM D YYYY')}`}
            style={{ backgroundColor: primaryColor }}
            children={logoImageUrl ? <img src={logoImageUrl} className={css(styles.image)} /> : ''}
          >
          </CardTitle>
          <Divider />
          <div style={{ margin: '20px' }}>
            <div dangerouslySetInnerHTML={{ __html: introHtml }} />
          </div>
          <CardActions>
            { (window.NOT_IN_USA && window.ALLOW_SEND_ALL) ? '' : this.renderBadgedButton({
              assignment,
              title: 'Send first texts',
              count: unmessagedCount,
              primary: true,
              disabled: false,
              contactsFilter: 'text',
              hideIfZero: !useDynamicAssignment
            })}
            { (window.NOT_IN_USA && window.ALLOW_SEND_ALL) ? '' : this.renderBadgedButton({
              assignment,
              title: 'Send replies',
              count: unrepliedCount,
              primary: false,
              disabled: false,
              contactsFilter: 'reply',
              hideIfZero: true
            })}
            { (window.NOT_IN_USA && window.ALLOW_SEND_ALL) ? this.renderBadgedButton({
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
  data: PropTypes.object,
  mutations: PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getContacts($assignmentId: String!, $contactsFilter: ContactsFilter!) {
      assignment(id: $assignmentId) {
        id
        texter {
          id
          firstName
          lastName
          assignedCell
        }
        campaign {
          id
          isArchived
          customFields
          useDynamicAssignment
          organization {
            id
            textingHoursEnforced
            textingHoursStart
            textingHoursEnd
            threeClickEnabled
          }
        }
        contacts(contactsFilter: $contactsFilter) {
          id
          firstName
          lastName
          cell
          zip
          customFields
          optOut {
            id
            createdAt
          }
          currentInteractionStepScript
          location {
            city
            state
            timezone {
              offset
              hasDST
            }
          }
        }
      }
    }`,
    variables: {
      contactsFilter: {
        messageStatus: 'needsMessage',
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId: ownProps.assignment.id
    },
    forceFetch: true
  }
})

export default loadData(withRouter(AssignmentSummary), { mapQueriesToProps })
