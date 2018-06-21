import PropTypes from 'prop-types'
import React from 'react'
import { List, ListItem } from 'material-ui/List'
import moment from 'moment'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import Divider from 'material-ui/Divider'
import { red300 } from 'material-ui/styles/colors'
import Linkify from 'react-linkify'

const styles = {
  optOut: {
    fontSize: '13px',
    fontStyle: 'italic'
  },
  sent: {
    fontSize: '13px',
    textAlign: 'right',
    marginLeft: '24px',
    whiteSpace: 'pre-wrap'
  },
  received: {
    fontSize: '13px',
    marginRight: '24px',
    whiteSpace: 'pre-wrap'
  }
}

const MessageList = function MessageList(props) {
  const { contact } = props
  const { optOut, messages } = contact

  const optOutItem = optOut ? (
    <div>
      <Divider />
      <ListItem
        style={styles.optOut}
        leftIcon={<ProhibitedIcon style={{ fill: red300 }} />}
        disabled
        primaryText={`${contact.firstName} opted out of texts`}
        secondaryText={moment(optOut.createdAt).fromNow()}
      />
    </div>
  ) : ''

  return (
    <List>
      {messages.map(message => (
        <ListItem
          disabled
          style={message.isFromContact ? styles.received : styles.sent}
          key={message.id}
          primaryText={<Linkify>{message.text}</Linkify>}
          secondaryText={moment(message.createdAt).fromNow()}
        />
      ))}
      {optOutItem}
    </List>
  )
}

MessageList.propTypes = {
  contact: PropTypes.object
}

export default MessageList
