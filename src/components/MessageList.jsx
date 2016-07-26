import React from 'react'
import { List, ListItem } from 'material-ui/List'
import moment from 'moment'
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

class MessageList extends React.Component {
  render() {
    const { contact } = this.props
    const { optOut, messages } = contact

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

    return (
      <List>
        {messages.map(message => (
        <ListItem
          disabled
          style={message.isFromContact ? styles.received : styles.sent}
          key={message.id}
          primaryText={message.text}
          secondaryText={moment(message.createdAt).fromNow()}
        />))}
        {optOutItem}
      </List>
    )
  }
}

export default MessageList