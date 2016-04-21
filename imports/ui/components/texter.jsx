import React, { Component } from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper'
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField'
import Divider from 'material-ui/Divider';

import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton/IconButton';
import DescriptionIcon from 'material-ui/svg-icons/action/description';
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before';
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next';
import PersonIcon from 'material-ui/svg-icons/social/person';

import MenuItem from 'material-ui/MenuItem';

import RaisedButton from 'material-ui/RaisedButton';
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui/Toolbar';
import { MessagesList } from './messages_list'
import { sendMessage } from '../../api/campaign_contacts/methods';
import { displayError } from '../helpers/errors';
import { applyScript } from '../helpers/script_helpers'
import LinearProgress from 'material-ui/LinearProgress';

export class Texter extends Component {
  constructor(props) {
    super(props);
    this.state = { currentContactIndex: 0 };
  }

  currentContact() {
    const {contacts} = this.props
    const index = this.state.currentContactIndex
    return (index >= contacts.length) ? null : contacts[index];
  }

  contactCount() {
    const {contacts} = this.props
    return contacts.length
  }

  handleNavigateNext(event) {
    this.goToNextContact()
  }

  handleNavigatePrevious(event) {
    this.goToPreviousContact()
  }

  goToNextContact() {
    this.incrementCurrentContactIndex(1)
  }

  goToPreviousContact() {
    this.incrementCurrentContactIndex(-1)
  }

  incrementCurrentContactIndex(increment) {
    let newIndex = this.state.currentContactIndex;
    newIndex = newIndex + increment;
    this.setState({currentContactIndex: newIndex})
  }

  defaultScript() {
    const contact = this.currentContact()
    if (contact.messages.length > 0)
      return ''

    const {assignment} = this.props
    console.log("assignment", assignment)
    console.log(assignment.campaign);
    return applyScript(assignment.campaign.script, contact);
  }

  handleSendMessage(event) {
    event.preventDefault();
    const input = this.refs.newMessageInput;
    if (input.getValue().trim()) {
      sendMessage.call({
        campaignContactId: this.currentContact()._id,
        text: input.getValue(),
        isFromContact: false
      }, (error, result) => {
        if (error)
        {
            alert(error);
        }
        else
        {
          input.value = '';
          this.goToNextContact()
        }
      });
    }

  }

  render() {
    const contact = this.currentContact()

    if (!contact)
      return <Paper><h1>Great job! You finished all the texts!</h1></Paper>
    const currentCount = this.state.currentContactIndex + 1
    const contactCount = this.contactCount()

    return (
        <Paper>
          <Toolbar>
            <ToolbarGroup firstChild={true} float="left">
              <IconButton onClick={this.handleNavigatePrevious.bind(this)}><NavigateBeforeIcon /></IconButton>
            </ToolbarGroup>
            <ToolbarGroup>
              <ToolbarTitle text={currentCount + "/" + contactCount + " messages" } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true} float="right">
              <IconButton onClick={this.handleNavigateNext.bind(this)}><NavigateNextIcon /></IconButton>
            </ToolbarGroup>

          </Toolbar>
          <LinearProgress mode="determinate" value={this.state.currentContactIndex * 100/contactCount} />

          <Card>
            <CardHeader
              avatar={<PersonIcon/>}
              title={contact.name}
              subtitle={contact.number} />
          </Card>

          {contact.messages.length > 0 ? <MessagesList messages={contact.messages}/> : ''}

          <Divider />
          <TextField
            ref="newMessageInput"
             hintText="Enter your message here!"
             value={this.defaultScript()}
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
                   <RaisedButton onClick={this.handleSendMessage.bind(this)} label="Send" primary={true} />
                 </ToolbarGroup>
               </Toolbar>
      </Paper>
    );
  }
}

