import React, { Component } from 'react'
import { Card, CardTitle, CardText, CardActions } from 'material-ui/Card'
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField'
import Divider from 'material-ui/Divider'

import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton/IconButton'
import DescriptionIcon from 'material-ui/svg-icons/action/description'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'

import MenuItem from 'material-ui/MenuItem'

import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar'
import { MessagesList } from './messages_list'
import { sendMessage } from '../../api/campaign_contacts/methods'
import { applyScript } from '../helpers/script_helpers'
import LinearProgress from 'material-ui/LinearProgress'

const styles = {
  card: {
    width: 500,
    margin: '20px auto'
  },
  textarea: {
    padding: 20
  },
  heading: {
    padding: 20
  }
}

const STARTING_INDEX = -1

export class Texter extends Component {
  constructor(props) {
    super(props)

    this.state = {
      currentContactIndex: -1,
      inputValue: ''
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleNavigateNext = this.handleNavigateNext.bind(this)
    this.handleNavigatePrevious = this.handleNavigatePrevious.bind(this)
    this.handleSendMessage = this.handleSendMessage.bind(this)
    this.handleBeginTexting = this.handleBeginTexting.bind(this)
  }

  currentContact() {
    const { contacts } = this.props
    const index = this.state.currentContactIndex
    return (index >= contacts.length) ? null : contacts[index]
  }

  contactCount() {
    const { contacts } = this.props
    return contacts.length
  }

  hasPrevious() {
    return this.state.currentContactIndex > 0
  }

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1
  }

  handleNavigateNext() {
    this.goToNextContact()
  }

  handleNavigatePrevious() {
    this.goToPreviousContact()
  }

  handleBeginTexting() {
    this.updateCurrentContactIndex(0)
  }

  goToNextContact() {
    this.incrementCurrentContactIndex(1)
  }

  goToPreviousContact() {
    this.incrementCurrentContactIndex(-1)
  }

  incrementCurrentContactIndex(increment) {
    let newIndex = this.state.currentContactIndex
    newIndex = newIndex + increment
    this.updateCurrentContactIndex(newIndex)
  }

  updateCurrentContactIndex(newIndex) {
    const contact = this.props.contacts[newIndex]
    const inputValue = this.defaultScript(contact)
    this.setState({
      currentContactIndex: newIndex,
      inputValue
    })
  }

  defaultScript(contact) {
    if (contact.messages.length > 0)
    {
      return ''
    }

    const { assignment } = this.props
    return applyScript(assignment.campaign.script, contact)
  }

  handleSendMessage(event) {
    event.preventDefault()
    const input = this.refs.newMessageInput
    if (input.getValue().trim()) {
      sendMessage.call({
        campaignContactId: this.currentContact()._id,
        text: input.getValue(),
        isFromContact: false
      }, (error) => {
        if (error) {
            alert(error)
        } else {
          input.value = ''
          this.goToNextContact()
        }
      })
    }
  }

  handleChange(event) {
    this.setState({
      inputValue: event.target.value
    })
  }

  renderNavigationToolbar(contact) {
    const currentCount = this.state.currentContactIndex + 1
    const title = contact.name + ' - ' + currentCount + '/' + this.contactCount() + ' messages'
    return (
    <Toolbar>
      <ToolbarGroup firstChild float="left">
        <IconButton
          disabled={!this.hasPrevious()}
          onClick={this.handleNavigatePrevious}
        >
          <NavigateBeforeIcon />
        </IconButton>

      </ToolbarGroup>
      <ToolbarGroup>
        <ToolbarTitle text={title} />
      </ToolbarGroup>
      <ToolbarGroup lastChild float="right">
        <IconButton
          disabled={!this.hasNext()}
          onClick={this.handleNavigateNext}
        >
          <NavigateNextIcon />
        </IconButton>
      </ToolbarGroup>

    </Toolbar>)
  }

  render() {
    const contact = this.currentContact()
    const { assignment } = this.props
    const campaign = assignment.campaign

    console.log(this.currentContactIndex, STARTING_INDEX)
    if (this.currentContactIndex === STARTING_INDEX) {
      return (
      <Card style={styles.card}>
         <CardTitle title={campaign.title} subtitle={campaign.description} />
         <CardText>You have {this.contactCount()} initial messages to send!</CardText>
         <CardActions>
           <RaisedButton onChange={this.handleBeginTexting} label="Start sending messages!" />
        </CardActions>
      </Card>)
    }

    if (!contact) {
      return (<Paper><h1>Great job! You finished all the texts!</h1></Paper>)
    }

    return (
        <div>
          <Card style={styles.card}>
            <CardTitle title={campaign.title} subtitle={campaign.description} />
            {this.renderNavigationToolbar(contact)}
            <LinearProgress mode="determinate" value={this.state.currentContactIndex * 100 / this.contactCount()} />

            {contact.messages.length > 0 ? <MessagesList messages={contact.messages} /> : ''}

            <Divider />
            <div style={styles.textarea}>
              <TextField
                ref="newMessageInput"
                floatingLabelText="Your message"
                value={this.state.inputValue}
                onChange={this.handleChange}
                multiLine
                fullWidth
              />
            </div>
            <Toolbar>
              <ToolbarGroup firstChild>
                <IconMenu
                  iconButtonElement={<IconButton><DescriptionIcon /></IconButton>}>
                  <MenuItem primaryText="Insert scripts" />
                </IconMenu>
              </ToolbarGroup>
              <ToolbarGroup>
                <RaisedButton
                  disabled={!this.state.inputValue}
                  onClick={this.handleSendMessage}
                  label="Send"
                  primary
                />
              </ToolbarGroup>
            </Toolbar>
          </Card>
        </div>
    )
  }
}
