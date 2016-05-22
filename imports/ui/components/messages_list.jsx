import React, { Component } from 'react'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'
import { moment } from 'meteor/momentjs:moment'

const styles = {
  scroll: {
    // maxHeight: 200,
    // overflow: 'auto'
  },
  message: {
    sent: {
      textAlign: 'right',
      fontSize: '13px',
      // backgroundColor: 'blue',
      marginLeft: '24px'
    },
    received: {
      fontSize: '13px',
      marginRight: '24px'
    }
  }
}

export class MessagesList extends Component {
  componentDidMount() {
    const node = this.refs.scrollContainer
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }

  render() {
    const { messages } = this.props;
    if (messages.length === 0) {
      return null
    }

    return (
      <div ref="scrollContainer" style={styles.scroll}>
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
      </div>
    );
  }
}