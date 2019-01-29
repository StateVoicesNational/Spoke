import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Form from 'react-formal'
import yup from 'yup'
import gql from 'graphql-tag'
import { StyleSheet, css } from 'aphrodite'

import loadData from '../../containers//hoc/load-data'
import wrapMutations from '../../containers/hoc/wrap-mutations'
import GSForm from '../../components/forms/GSForm'
import SendButton from '../../components/SendButton'

const styles = StyleSheet.create({
  messageField: {
    padding: '0px 8px',
  },
})

class MessageResponse extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messageText: '',
      isSending: false
    }
  }

  createMessageToContact(text) {
    const { contact, texter  } = this.props.conversation

    return {
      assignmentId: contact.assignmentId,
      contactNumber: contact.cell,
      userId: texter.id,
      text
    }
  }

  handleMessageFormChange = ({ messageText }) => this.setState({ messageText })

  handleMessageFormSubmit = async ({ messageText }) => {
    const { contact } = this.props.conversation
    const message = this.createMessageToContact(messageText)
    if (this.state.isSending) {
      return // stops from multi-send
    }
    this.setState({ isSending: true })

    const finalState = { isSending: false }
    try {
      const response = await this.props.mutations.sendMessage(message, contact.id)
      const { messages } = response.data.sendMessage
      this.props.messagesChanged(messages)
      finalState.messageText = ''
    } catch (e) {
      this.handleSendMessageError(e)
    }

    this.setState(finalState)
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
      messageText: yup.string().required('Can\'t send empty message').max(window.MAX_MESSAGE_LENGTH)
    })

    const { messageText, isSending } = this.state
    const isSendDisabled = isSending || messageText.trim() === ''

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
                disabled={isSendDisabled}
              />
            </div>
            <div style={{marginRight: '120px'}}>
              <Form.Field
                name='messageText'
                label='Send a response'
                multiLine
                fullWidth
                disabled={isSending}
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
  conversation: PropTypes.object,
  messagesChanged: PropTypes.func
}

const mapMutationsToProps = () => ({
  createOptOut: (optOut, campaignContactId) => ({
    mutation: gql`
      mutation createOptOut($optOut: OptOutInput!, $campaignContactId: String!) {
        createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
          id
          optOut {
            id
            createdAt
          }
        }
      }
    `,
    variables: {
      optOut,
      campaignContactId
    }
  }),
  sendMessage: (message, campaignContactId) => ({
    mutation: gql`
      mutation sendMessage($message: MessageInput!, $campaignContactId: String!) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
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
      message,
      campaignContactId
    }
  })
})

export default loadData(wrapMutations(MessageResponse), {
  mapMutationsToProps
})
