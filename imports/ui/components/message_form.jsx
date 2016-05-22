import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import RaisedButton from 'material-ui/RaisedButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import Divider from 'material-ui/Divider'

import { MessagesList } from './messages_list'
import { SurveyList } from './survey_list'
import { MessageField } from './message_field'
import { ResponseDropdown } from './response_dropdown'

import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'

const styles = {
  navigationToolbar: {
    backgroundColor: 'white',
    position: 'fixed',
    width: '100%',
    left: 0,
    display: 'flex',
    right: 0,
    bottom: 0
  },
  messageField: {
    position: 'fixed',
    width: '100%',
    left: 0,
    display: 'flex',
    right: 0,
    bottom: 56
  }
}

export class MessageForm extends Component {
  handleSendMessage(event) {
    event.preventDefault()
    const input = this.refs.input
    const onSuccess =  this.props.onSendMessage
    this.sendMessageToCurrentContact(input.getValue().trim(), onSuccess)
  }

  sendMessageToCurrentContact(text, onSendMessage) {
    const { campaignContact } = this.props
    sendMessage.call({
      text,
      campaignId: campaignContact.campaignId,
      contactNumber: campaignContact.cell,
    }, (error) => {
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

  render() {
    const {
      campaignContact,
      initialScript,
      leftToolbarChildren,
      rightToolbarChildren,
      secondaryToolbar
    } = this.props

    const messages = campaignContact.messages().fetch()
    return (
      <div>
        <div style={styles.messageField}>
          <MessageField ref="input" initialScript={initialScript} />
        </div>

        <MessagesList messages={messages} />
        <Divider />
        { secondaryToolbar }
        <Toolbar style={styles.navigationToolbar}>
          <ToolbarGroup firstChild>
            <RaisedButton
              onClick={this.handleSendMessage.bind(this)}
              label="Send"
              primary
            />
            { leftToolbarChildren }
          </ToolbarGroup>
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
