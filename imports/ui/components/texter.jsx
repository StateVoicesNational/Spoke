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

  hasPrevious() {
    return this.state.currentContactIndex > 0
  }

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1
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
    const {assignment} = this.props
    if (!contact)
      return <Paper><h1>Great job! You finished all the texts!</h1></Paper>
    const currentCount = this.state.currentContactIndex + 1
    const contactCount = this.contactCount()

    return (
        <div>
          <Card style={styles.card}>
           <CardTitle title={assignment.campaign.title} subtitle={assignment.campaign.description}/>
          <Toolbar>
            <ToolbarGroup firstChild={true} float="left">
              <IconButton
                disabled={!this.hasPrevious()}
                onClick={this.handleNavigatePrevious.bind(this)}><NavigateBeforeIcon /></IconButton>

            </ToolbarGroup>
            <ToolbarGroup>
              <ToolbarTitle text={contact.name + " - " +  currentCount + "/" + contactCount + " messages" } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true} float="right">
              <IconButton
                disabled={!this.hasNext()}
                onClick={this.handleNavigateNext.bind(this)}><NavigateNextIcon /></IconButton>
            </ToolbarGroup>

          </Toolbar>
          <LinearProgress mode="determinate" value={this.state.currentContactIndex * 100/contactCount} />



          {contact.messages.length > 0 ? <MessagesList messages={contact.messages}/> : ''}

          <Divider />
          <div style={styles.textarea}>
          <TextField
            ref="newMessageInput"
             hintText="Enter your message here!"
             value={this.defaultScript()}
             multiLine={true}
             fullWidth={true}/>
            </div>
          <Toolbar>
                 <ToolbarGroup firstChild={true}>
                 <IconMenu
                   iconButtonElement={<IconButton><DescriptionIcon /></IconButton>}>
                   <MenuItem primaryText="Insert scripts" />
                 </IconMenu>
                 </ToolbarGroup>
                 <ToolbarGroup>
                   <RaisedButton onClick={this.handleSendMessage.bind(this)} label="Send" primary={true} />
                 </ToolbarGroup>
               </Toolbar>
          </Card>
      </div>
    );
  }
}

const styles = {
  card: {
    width:500,
    margin: '20px auto',
  },
  textarea: {
    padding: 20
  },
  heading: {
    padding: 20
  },
}

