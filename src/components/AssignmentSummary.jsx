import PropTypes from 'prop-types';
import React, { Component } from 'react'
import { Card, CardActions, CardTitle } from 'material-ui/Card'
import { StyleSheet, css } from 'aphrodite'
import loadData from '../containers/hoc/load-data'
import { applyScript } from '../lib/scripts'
import gql from 'graphql-tag'
import FlatButton from 'material-ui/FlatButton'
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
  }
})

class AssignmentSummary extends Component {
  state = {
    badTimezoneTooltipOpen: false,
    open: false
  }

  goToTodos(contactsFilter, assignmentId) {
    const { organizationId, router } = this.props

    if (contactsFilter) {
      router.push(`/app/${organizationId}/todos/${assignmentId}/${contactsFilter}`)
    }
  }

  createMessage(text, texterId, assignmentId, contactCell) {
    return {
      contactNumber: contactCell,
      userId: texterId,
      text,
      assignmentId
    }
  }

  sendMessages = () => {
    const assignmentData = this.props.data.assignment
    const contacts = assignmentData.contacts
    const texter = assignmentData.texter
    const contactMessages = contacts.map(contact => {
      const script = contact.currentInteractionStepScript
      const text = applyScript({
        contact,
        texter,
        script
      })
      return {
        campaignContactId: contact.id,
        message: this.createMessage(
          text,
          texter.id,
          assignmentData.id,
          contact.cell
        )
      }
    })
    this.props.mutations.sendMessages(contactMessages)
    this.setState({ open: false })
  }

  handleClose = () => {
    this.setState({ open: false })
  }

  showConfirmationDialog = () => {
    this.setState({ open: true })
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

  renderTextAllButton({ title, count, primary, disabled }) {
    if (window.ALLOW_SEND_ALL) {
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
            onTouchTap={this.showConfirmationDialog}
          />
        </Badge>
      )
    }
    return ''
  }

  render() {
    const { assignment, unmessagedCount, unrepliedCount, badTimezoneCount } = this.props
    const { title, description, dueBy } = assignment.campaign
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
            {this.renderTextAllButton({
              title: 'Send All first texts',
              count: unmessagedCount,
              primary: true,
              disabled: false,
              contactsFilter: 'text-all'
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
              title: 'Send later',
              count: badTimezoneCount,
              primary: false,
              disabled: true,
              contactsFilter: null
            })}
          </CardActions>
        </Card>
        <Dialog
          title='Are you sure?'
          actions={actions}
          open={this.state.open}
          modal
        >
          Are you sure you want to send messages?
        </Dialog>
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

const mapMutationsToProps = () => ({
  sendMessages: (contactMessages) => ({
    mutation: gql`
      mutation sendMessages($contactMessages: [ContactMessage]) {
        sendMessages(contactMessages: $contactMessages) {
          id
          messageStatus
          messages {
            id
            createdAt
            text
            isFromContact
          }
        }
      }
    `,
    variables: {
      contactMessages
    }
  })
})

export default loadData(withRouter(AssignmentSummary), { mapQueriesToProps, mapMutationsToProps })
