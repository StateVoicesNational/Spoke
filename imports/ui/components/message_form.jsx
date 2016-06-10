import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import RaisedButton from 'material-ui/RaisedButton'
import { moment } from 'meteor/momentjs:moment'

import { MessageField } from './message_field'
import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'

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
      submitting: false
    }
  }

  handleSendMessage() {
    console.log("handle send!")
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

  sendMessageToCurrentContact(text, onSendMessage) {
    const { campaignContact } = this.props
    sendMessage.call({
      text,
      campaignId: campaignContact.campaignId,
      contactNumber: campaignContact.cell,
    }, (error) => {
      this.setState({
        submitting: false
      })

      if (error) {
        alert(error)
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
    const sendButton = (
      <ToolbarGroup firstChild>
        <RaisedButton
          onClick={this.handleSendMessage}
          label={"Send"}
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
    </div>
    )

  }
}

MessageForm.propTypes = {
  initialScript: React.PropTypes.string,      // current assignment
  campaignContact: React.PropTypes.object  // contacts for current assignment
}
