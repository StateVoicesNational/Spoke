import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import { moment } from 'meteor/momentjs:moment'

export class MessagesList extends Component {
  componentDidMount() {
    let node = this.refs.scrollContainer;
    node.scrollTop = node.scrollHeight;
  }

  render() {
    const { messages } = this.props;
    return (
      <div ref="scrollContainer" style={style}>
        <List>
        <Subheader>Your conversation</Subheader>
          {messages.map(message => (
          <ListItem
            key={message.createdAt}
            primaryText={message.text}
            secondaryText={moment(message.createdAt).fromNow()}
          />))}
        </List>
      </div>
    );
  }
}

const style = {
  'maxHeight': 400,
  overflow: 'auto'
};