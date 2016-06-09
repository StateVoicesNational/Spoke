import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import RaisedButton from 'material-ui/RaisedButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import { moment } from 'meteor/momentjs:moment'

import { MessageField } from './message_field'
import { Empty } from '../components/empty'
import TextField from 'material-ui/TextField'
import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'
import SmsIcon from 'material-ui/svg-icons/communication/textsms';
import { ListItem } from 'material-ui/List'
import  Divider from 'material-ui/Divider'

const styles = {
  navigationToolbar: {
    // width: '100%',
    // backgroundColor: 'white',
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
  optOutMessage: {
    fontStyle: 'italic'
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
      if (this.props.onSendMessage) {
        this.props.onSendMessage()
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
    console.log("MessageForm initialScript", initialScript)
    const optOut = campaignContact.optOut()
    const { isSending } = this.state
    const messages = campaignContact.messages().fetch()
    return (
      <div>
        { optOut ? (
          <div style={styles.optOutMessage}>
            <Divider />
            <ListItem
              disabled
              primaryText={`${campaignContact.firstName} opted out of texts`}
              secondaryText={moment(optOut.createdAt).fromNow()}
            />
          </div>
          ) : (
          <div>
            <div>
            </div>
          <div style={styles.messageField}>
            { secondaryToolbar }
            <MessageField
              ref="input"
              initialScript={initialScript}
            />
          </div>
          </div>
          )}
        <Toolbar style={styles.navigationToolbar}>
          <ToolbarGroup firstChild>
            <RaisedButton
              onClick={this.handleSendMessage.bind(this)}
              label="Send"
              disabled={isSending || optOut}
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
