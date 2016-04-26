import React, { Component } from 'react'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'
import { moment } from 'meteor/momentjs:moment'

const styles = {
  scroll: {
    // maxHeight: 200,
    // overflow: 'auto'
  },
  fromContact: {
    textAlign: 'right',
    color: "blue"
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
    console.log("messages", messages)
    if (messages.length === 0) {
      return null
    }

    return (
      <div ref="scrollContainer" style={styles.scroll}>
        <List>
          {messages.map(message => (
          <ListItem
            style={message.isFromContact ? styles.fromContact : {}}
            key={message.createdAt}
            primaryText={message.text}
            secondaryText={moment(message.createdAt).fromNow()}
          />))}
        </List>
      </div>
    );
  }
}