import React from 'react'
import type from 'prop-types'
import Dialog from 'material-ui/Dialog'

const MessageList = (props) => {
  return  (
    <div>
      {props.messages.map((message, index) => {
        const isFromContact = message.isFromContact
        const style = {
          color: isFromContact ? 'blue' : 'black',
          textAlign: isFromContact ? 'left' : 'right'
        }

        return (
          <p key={index} style={style}>
            {message.text}
          </p>
        )
      })}
    </div>
  )
}

MessageList.propTypes = {
  messages: type.arrayOf(type.object),
}

const ConversationPreviewBody = (props) => {
  const { contact } = props

  return (
      <MessageList messages={contact.messages} />
  )
}

ConversationPreviewBody.propTypes = {
  contact: type.object
}

const ConversationPreviewModal = (props) => {
  const { contact } = props,
        isOpen = contact !== undefined
  return (
    <Dialog
      title='Messages'
      open={isOpen}
      modal={false}
      autoScrollBodyContent
      onRequestClose={props.onRequestClose}
    >
      {isOpen && <ConversationPreviewBody contact={contact} />}
    </Dialog>
  )
}

ConversationPreviewModal.propTypes = {
  contact: type.object,
  onRequestClose: type.func
}

export default ConversationPreviewModal
