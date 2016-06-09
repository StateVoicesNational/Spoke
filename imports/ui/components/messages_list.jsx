import React, { Component } from 'react'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'
import { moment } from 'meteor/momentjs:moment'

const styles = {
  message: {
    sent: {
      textAlign: 'right',
      fontSize: '13px',
      marginLeft: '24px'
    },
    received: {
      fontSize: '13px',
      marginRight: '24px'
    }
  }
}

export class MessagesList extends Component {
  render() {
    const { messages } = this.props;
    if (messages.length === 0) {
      return null
    }

    return (
      <List>
        {messages.map(message => (
        <ListItem
          disabled
          style={message.isFromContact ? styles.message.received : styles.message.sent}
          key={message.createdAt}
          primaryText={message.text}
          secondaryText={moment(message.createdAt).fromNow()}
        />))}
      </List>
    )
  }
}