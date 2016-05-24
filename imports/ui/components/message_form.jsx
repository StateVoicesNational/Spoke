import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import RaisedButton from 'material-ui/RaisedButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'

import { MessagesList } from './messages_list'
import { SurveyList } from './survey_list'
import { MessageField } from './message_field'
import { ResponseDropdown } from './response_dropdown'
import { Empty } from '../components/empty'
import TextField from 'material-ui/TextField'
import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'
import SmsIcon from 'material-ui/svg-icons/communication/textsms';

const styles = {
  navigationToolbar: {
    width: '100%',
    backgroundColor: 'white',
    position: 'fixed',
    width: '100%',
    left: 0,
    display: 'flex',
    right: 0,
    bottom: 0
  },
  messageField: {
    width: '100%',
    position: 'fixed',
    width: '100%',
    left: 0,
    display: 'flex',
    right: 0,
    bottom: 56
  }
}

export class MessageForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isSending: false
    }
  }
  handleSendMessage(event) {
    event.preventDefault()
    const input = this.refs.input
    const messageText = input.getValue().trim()

    const onSuccess = () => {
      this.setState({ isSending: false })
      this.props.onSendMessage()
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
      if (error) {
        this.setState({
          isSending: false
        })
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

    const { isSending } = this.state
    const messages = campaignContact.messages().fetch()
    return (
      <div>
        { messages.length === 0 ? (
            <Empty
              title="No conversation yet"
              icon={<SmsIcon />}
            />
        ) : <MessagesList messages={messages} /> }
        <div style={styles.messageField}>
          { secondaryToolbar }
          <MessageField
            ref="input"
            initialScript={initialScript}
          />
        </div>
        <Toolbar style={styles.navigationToolbar}>
          <ToolbarGroup firstChild>
            <RaisedButton
              onClick={this.handleSendMessage.bind(this)}
              label="Send"
              disabled={isSending}
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
