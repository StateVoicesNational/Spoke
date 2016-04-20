import React, { Component } from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper'
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField'
import Divider from 'material-ui/Divider';

import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton/IconButton';
import DescriptionIcon from 'material-ui/svg-icons/action/description';
import MenuItem from 'material-ui/MenuItem';

import RaisedButton from 'material-ui/RaisedButton';
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui/Toolbar';
import { MessagesList } from './messages_list'
import { sendMessage } from '../../api/campaign_contacts/methods.js';
import { displayError } from '../helpers/errors.js';

export class Texter extends Component {
  sendMessage(event) {
    event.preventDefault();
    const input = this.refs.newMessageInput;
    if (input.getValue().trim()) {
      sendMessage.call({
        campaignContactId: this.props.contact._id,
        text: input.getValue(),
        isFromContact: false
      }, displayError);
      input.value = '';
    }
  }

  render() {
    const { contact } = this.props;
    return (
        <Paper>
          <Card key={contact.contactId}>
            <CardHeader
              title={contact.name}
              subtitle={contact.number} />
          </Card>

          <MessagesList messages={contact.messages}/>
          <Divider />
          <TextField
            ref="newMessageInput"
             hintText="Enter your message here!"
             defaultValue={contact.messages.length > 0 ? '' : "Hey there, " + contact.name + "! This is Smee from the Batman 2016 campaign. Thanks for helping us out. The next few states are really important for us to win! Can you join us for a phonebanking event near you next Thursday at 5pm?"}
             multiLine={true}
             fullWidth={true}/>

          <Toolbar>
                 <ToolbarGroup firstChild={true}>
                 <IconMenu
                   iconButtonElement={<IconButton><DescriptionIcon /></IconButton>}>
                   <MenuItem primaryText="Refresh" />
                   <MenuItem primaryText="Send feedback" />
                   <MenuItem primaryText="Settings" />
                   <MenuItem primaryText="Help" />
                   <MenuItem primaryText="Sign out" />
                 </IconMenu>
                 </ToolbarGroup>
                 <ToolbarGroup>
                   <RaisedButton onClick={this.sendMessage.bind(this)} label="Send" primary={true} />
                 </ToolbarGroup>
               </Toolbar>
      </Paper>
    );
  }
}

