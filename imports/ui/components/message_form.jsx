import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import RaisedButton from 'material-ui/RaisedButton'
import { moment } from 'meteor/momentjs:moment'

import { MessageField } from './message_field'
import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'
import Snackbar from 'material-ui/Snackbar';

const styles = {
  navigationToolbar: {
    // width: '100%',
    backgroundColor: 'white',
    // position: 'fixed',
    // width: '100%',
    // left: 0,
    // display: 'flex',
    // right: 0,
    // bottom: 0
  },
  messageField: {
    // left: 0,
    // // display: 'flex',
    // right: 0,
    // bottom: 56
  },
}

export class MessageForm extends Component {
  constructor(props) {
    super(props)
    this.handleSendMessage = this.handleSendMessage.bind(this)
    this.handleMessageFieldKeyDown = this.handleMessageFieldKeyDown.bind(this)
    this.state = {
      submitting: false,
      snackbarOpen: false,
      snackbarMessage: ''
    }
  }

  handleRequestChange() {
    this.setState({ snackbarOpen: false })
  }

  handleSendMessage() {
    const { onSendMessage } = this.props

    this.setState( { submitting: true })
    const input = this.refs.input
    const messageText = input.getValue().trim()

    const onSuccess = () => {
      if (onSendMessage) {
        onSendMessage()
      }
    }
    this.sendMessageToCurrentContact(messageText, onSuccess)
  }

  handleError(error) {
    const { onSendMessage } = this.props
    if (error.error === 'message-send-timezone-error') {
      this.setState({
        snackbarMessage: "Didn't send that last message because it's outside texting hours for the contact.",
        snackbarOpen: true
      })
      if (onSendMessage) {
        onSendMessage()
      }
    } else {
      alert(error)
    }
  }

  sendMessageToCurrentContact(text, onSendMessage) {
    const { campaignContact } = this.props
    sendMessage.call({
      text,
      campaignId: campaignContact.campaignId,
      contactNumber: campaignContact.cell,
      timezoneOffset: campaignContact.utcOffset()
    }, (error) => {
      this.setState({
        submitting: false
      })

      if (error) {
        this.handleError(error)
      } else {
        if (onSendMessage)
        {
          onSendMessage()
        }
      }
    })
  }

  handleMessageFieldKeyDown(event) {
    if ((event.keyCode == 10 || event.keyCode == 13) && event.metaKey) {
      console.log(this.handleSendMessage, this)
      this.handleSendMessage()
    }
  }
  render() {
    const {
      campaignContact,
      initialScript,
      leftToolbarChildren,
      rightToolbarChildren,
      secondaryToolbar
    } = this.props

    const optOut = campaignContact.optOut()
    const messageInput = (
      <div style={styles.messageField}>
        { secondaryToolbar }
        <MessageField
          onKeyDown={this.handleMessageFieldKeyDown}
          ref="input"
          initialScript={initialScript}
        />
      </div>
    )
    const isMac = (navigator.appVersion.indexOf("Mac") !== -1 )

    const sendButton = (
      <ToolbarGroup firstChild>
        <RaisedButton
          onClick={this.handleSendMessage}
          label="Send"
          label={`Send ${isMac ? '⌘' : 'ctrl'}  \u21b5`}
          disabled={this.state.submitting|| optOut}
          primary
        />
        { leftToolbarChildren }
      </ToolbarGroup>
    )

    const { submitting } = this.state
    const messages = campaignContact.messages().fetch()
    return (
      <div>
          { optOut ? '' : messageInput}
        <Toolbar style={styles.navigationToolbar}>
          { optOut ? '' : sendButton }

          <ToolbarGroup float="right">
            { rightToolbarChildren }
          </ToolbarGroup>
        </Toolbar>
        <Snackbar
          open={this.state.snackbarOpen}
          message={this.state.snackbarMessage}
          autoHideDuration={3000}
          onRequestClose={this.handleRequestClose}
        />
    </div>
    )

  }
}

MessageForm.propTypes = {
  initialScript: React.PropTypes.string,      // current assignment
  campaignContact: React.PropTypes.object  // contacts for current assignment
}
