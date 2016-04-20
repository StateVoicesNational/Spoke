import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import { moment } from 'meteor/momentjs:moment'

export class MessagesList extends Component {
  render() {
    const { messages } = this.props;
    return (
      <List>
      <Subheader>Recent messages</Subheader>
        {messages.map(message => (
        <ListItem
          key={message.createdAt}
          primaryText={message.text}
          secondaryText={moment(message.createdAt).fromNow()}
        />))}
      </List>
    );
  }
}