import React, { Component } from 'react'
import { Card, CardTitle, CardText, CardActions } from 'material-ui/Card'
import Paper from 'material-ui/Paper'
import Divider from 'material-ui/Divider'

import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton/IconButton'
import DescriptionIcon from 'material-ui/svg-icons/action/description'

import MenuItem from 'material-ui/MenuItem'

import RaisedButton from 'material-ui/RaisedButton'

import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar'
import { MessagesList } from './messages_list'
import { updateSurveyResponse } from '../../api/campaign_contacts/methods'
import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'
import { Survey } from './survey'
import { MessageField } from './message_field'
import { TexterNavigationToolbar } from './texter_navigation_toolbar'
import { ResponseDropdown } from './response_dropdown'
const styles = {
  card: {
    width: 500,
    margin: '20px auto'
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
      currentContactIndex: 0,
    }

    this.handleNavigateNext = this.handleNavigateNext.bind(this)
    this.handleNavigatePrevious = this.handleNavigatePrevious.bind(this)
    this.handleSendMessage = this.handleSendMessage.bind(this)
    this.handleBeginTexting = this.handleBeginTexting.bind(this)

    this.handleSurveyChange = this.handleSurveyChange.bind(this)
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
    const { assignment, surveys } = this.props

    console.log("SURVEYS", surveys)

    return applyScript(contact.survey().script, contact)
  }

  handleSendMessage(event) {
    event.preventDefault()
    const input = this.refs.input

    if (input.getValue().trim()) {
      sendMessage.call({
        campaignId: this.props.assignment.campaignId,
        contactNumber: this.currentContact().number,
        userNumber: "test",
        text: input.getValue(),
        isFromContact: false
      }, (error) => {
        if (error) {
            alert(error)
        } else {
          input.value = ''
          // this.goToNextContact()
        }
      })
    }
  }

  handleSurveyChange(event) {
    const campaignSurveyId = event.target.value
    updateSurveyResponse.call({
      campaignSurveyId,
      campaignContactId: this.currentContact()._id
    })
  }

  navigationTitle(contact) {
    const currentCount = this.state.currentContactIndex + 1
    return contact.name + ' - ' + currentCount + '/' + this.contactCount() + ' messages'
  }

  render() {
    const contact = this.currentContact()
    const { assignment, messages } = this.props
    const campaign = assignment.campaign()

    console.log("messages in texter", messages)
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

            <TexterNavigationToolbar
              title={this.navigationTitle(contact)}
              hasPrevious={this.hasPrevious()}
              hasNext={this.hasNext()}
              onNext={this.handleNavigateNext}
              onPrevious={this.handleNavigatePrevious}
              progressValue={this.state.currentContactIndex * 100 / this.contactCount()} />

            <MessagesList messages={messages.filter((message) => message.contactNumber === contact.number)} />

            <Divider />
            <Survey question={contact.survey().question}
              answers={contact.survey().children().fetch()}
              onSurveyChange={this.handleSurveyChange} />
            <ResponseDropdown />
            <MessageField ref="input" script={this.defaultScript(contact)} />
            <Toolbar>
              <ToolbarGroup firstChild>
                <IconMenu
                  iconButtonElement={<IconButton><DescriptionIcon /></IconButton>}>
                  <MenuItem primaryText="Insert scripts" />
                </IconMenu>
              </ToolbarGroup>
              <ToolbarGroup>
                <RaisedButton
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
