import React, { Component } from 'react'
import { List, ListItem } from 'material-ui/List'
import { moment } from 'meteor/momentjs:moment'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import Divider from 'material-ui/Divider'
import { red300 } from 'material-ui/styles/colors'
const styles = {
    optOut: {
      fontSize: '13px',
      fontStyle: 'italic',
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

export class MessagesList extends Component {
  render() {
    const { messages, contact } = this.props
    const optOut = contact.optOut()

    const optOutItem = optOut ? (
      <div>
        <Divider />
        <ListItem
          style={styles.optOut}
          leftIcon={<ProhibitedIcon style={{fill: red300}} />}
          disabled
          primaryText={`${contact.firstName} opted out of texts`}
          secondaryText={moment(optOut.createdAt).fromNow()}
        />
      </div>
    ) : ''
    if (messages.length === 0) {
      return null
    }

    return (
      <List>
        {messages.map(message => (
        <ListItem
          disabled
          style={message.isFromContact ? styles.received : styles.sent}
          key={message.createdAt}
          primaryText={message.text}
          secondaryText={moment(message.createdAt).fromNow()}
        />))}
        {optOutItem}
      </List>
    )
  }
}