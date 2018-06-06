import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import red from '@material-ui/core/colors/red';
import NotInterestedIcon from '@material-ui/icons/NotInterested';

const styles = {
  optOut: {
    fontSize: '13px',
    fontStyle: 'italic'
  },
  sent: {
    fontSize: '13px',
    textAlign: 'right',
    marginLeft: '24px'
  },
  received: {
    fontSize: '13px',
    marginRight: '24px'
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
        leftIcon={<NotInterestedIcon style={{ fill: red[300] }} />}
        disabled={true}
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
          primaryText={message.text}
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
