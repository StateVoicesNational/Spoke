import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Form from 'react-formal'
import yup from 'yup'
import { StyleSheet, css } from 'aphrodite'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider'

import GSForm from '../../components/forms/GSForm'
import SendButton from '../../components/SendButton'

const styles = StyleSheet.create({
  mobile: {
    '@media(min-width: 425px)': {
      display: 'none !important'
    }
  },
  desktop: {
    '@media(max-width: 450px)': {
      display: 'none !important'
    }
  },
  conversationRow: {
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontWeight: 'normal',
  },
  messageField: {
    padding: '0px 8px',
  },
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

class MessageResponse extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messageText: '',
      disabled: false
    }
  }

  createMessageToContact(text) {
    const { assignment, contact, texter  } = this.props

    return {
      assignmentId: assignment.id,
      contactNumber: contact.cell,
      userId: texter.id,
      text
    }
  }

  handleMessageFormChange = ({ messageText }) => this.setState({ messageText })

  handleMessageFormSubmit = async ({ messageText }) => {
    try {
      const { contact } = this.props
      const message = this.createMessageToContact(messageText)
      if (this.state.disabled) {
        return // stops from multi-send
      }
      console.log(`Sending message to ${contact.id}: ${message}`)
      // this.setState({ disabled: true })
      // await this.props.mutations.sendMessage(message, contact.id)
    } catch (e) {
      this.handleSendMessageError(e)
    }
  }

  handleSendMessageError = (e) => {
    console.error(e)
    const newState = {
      // snackbarActionTitle: 'Back to todos',
      // snackbarOnTouchTap: this.goBackToTodos,
      snackbarError: e.message
    }
    this.setState(newState)
  }

  handleClickSendMessageButton = () => {
    this.refs.messageForm.submit()
  }

  render() {
    const messageSchema = yup.object({
      messageText: yup.string().required("Can't send empty message").max(window.MAX_MESSAGE_LENGTH)
    })

    return (
      <div className={css(styles.messageField)}>
        <GSForm
          ref='messageForm'
          schema={messageSchema}
          value={{ messageText: this.state.messageText }}
          onSubmit={this.handleMessageFormSubmit}
          onChange={this.handleMessageFormChange}
        >
          <div style={{position: 'relative'}}>
            <div style={{position: 'absolute', right: 0, bottom: 0, width: '120px'}}>
              <SendButton
                threeClickEnabled={false}
                onFinalTouchTap={this.handleClickSendMessageButton}
                disabled={this.state.messageText.trim() === ''}
              />
            </div>
            <div style={{marginRight: '120px'}}>
              <Form.Field
                className={css(styles.textField)}
                name='messageText'
                label='Send a response'
                multiLine
                fullWidth
                rowsMax={6}
              />
            </div>
          </div>
        </GSForm>
      </div>
    )
  }
}

MessageResponse.propTypes = {
  contact: PropTypes.object,
}

const ConversationPreviewBody = (props) => {
  const { contact } = props

  return (
    <div>
      <MessageList messages={contact.messages} />
      <Divider />
      <MessageResponse />
    </div>
  )
}

ConversationPreviewBody.propTypes = {
  contact: PropTypes.object
}

const ConversationPreviewModal = (props) => {
  const { contact } = props,
        isOpen = contact !== undefined

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
      {isOpen && <ConversationPreviewBody contact={contact} />}
    </Dialog>
  )
}

ConversationPreviewModal.propTypes = {
  contact: PropTypes.object,
  onRequestClose: PropTypes.func
}

export default ConversationPreviewModal
