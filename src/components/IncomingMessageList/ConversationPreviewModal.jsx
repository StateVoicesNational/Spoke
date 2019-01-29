import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, css } from 'aphrodite'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import Divider from 'material-ui/Divider'

import MessageResponse from './MessageResponse';

const styles = StyleSheet.create({
  conversationRow: {
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontWeight: 'normal',
  }
})

const MessageList = (props) => {
  return  (
    <div>
      {props.messages.map((message, index) => {
        const isFromContact = message.isFromContact
        const messageStyle = {
          marginLeft: isFromContact ? undefined : '60px',
          marginRight: isFromContact ? '60px' : undefined,
          backgroundColor: isFromContact ? '#AAAAAA' : 'rgb(33, 150, 243)',
        }

        return (
          <p key={index} className={css(styles.conversationRow)} style={messageStyle}>
            {message.text}
          </p>
        )
      })}
    </div>
  )
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object),
}

class ConversationPreviewBody extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messages: props.conversation.contact.messages
    }

    this.messagesChanged = this.messagesChanged.bind(this)
  }

  messagesChanged(messages) {
    this.setState({ messages })
  }

  render() {
    return (
      <div>
        <MessageList messages={this.state.messages} />
        <Divider />
        <MessageResponse conversation={this.props.conversation} messagesChanged={this.messagesChanged} />
      </div>
    )
  }
}

ConversationPreviewBody.propTypes = {
  conversation: PropTypes.object
}

const ConversationPreviewModal = (props) => {
  const { conversation } = props,
        isOpen = conversation !== undefined

  const actions = [
    <FlatButton
      label="Close"
      primary={true}
      onClick={props.onRequestClose}
    />
  ]

  return (
    <Dialog
      title='Messages'
      open={isOpen}
      actions={actions}
      modal={false}
      autoScrollBodyContent
      onRequestClose={props.onRequestClose}
    >
      {isOpen && <ConversationPreviewBody {...props} />}
    </Dialog>
  )
}

ConversationPreviewModal.propTypes = {
  conversation: PropTypes.object,
  onRequestClose: PropTypes.func
}

export default ConversationPreviewModal
