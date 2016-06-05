import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import IconButton from 'material-ui/IconButton/IconButton'
import RaisedButton from 'material-ui/RaisedButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import NavigateCloseIcon from 'material-ui/svg-icons/navigation/close'
import NavigateMoreVert from 'material-ui/svg-icons/navigation/more-vert'
import IconMenu from 'material-ui/IconMenu'
import Divider from 'material-ui/Divider'
import MenuItem from 'material-ui/MenuItem';
import { ContactToolbar } from './contact_toolbar'

import { SurveyList } from './survey_list'
import { MessageForm } from './message_form'
import { ResponseDropdown } from './response_dropdown'
import { QuestionDropdown } from './survey'

import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'
import { updateAnswer } from '../../api/survey_answers/methods'

const styles = {
  navigationToolbarTitle: {
    fontSize: "12px"
  },
  contactToolbar: {
    position: 'fixed',
    top: 0,
    width:'100%'
  },
  paper: {
    margin: '56px auto',
    top: 56,
    maxWidth: 800,
    height: '100%'
  }
}
export class AssignmentTexter extends Component {
  constructor(props) {
    super(props)

    this.state = {
      currentContactIndex: 0,
      script: ''
    }

    this.handleNavigateNext = this.handleNavigateNext.bind(this)
    this.handleNavigatePrevious = this.handleNavigatePrevious.bind(this)
    this.onSendMessage = this.onSendMessage.bind(this)
    this.handleScriptChange = this.handleScriptChange.bind(this)

    this.state.script = this.defaultScript()

  }

  componentDidUpdate(prevProps, prevState) {
    console.log("component did update", prevState)
    // TODO: This needs to be in a child component with state.
    const prevContact = this.getContact(prevProps.contacts, prevState.currentContactIndex)
    const newContact = this.currentContact()
    if (newContact && (!prevContact || (prevContact._id !== newContact._id))) {
      this.setSuggestedScript(this.defaultScript())
    }
  }

  defaultScript() {
    const { assignment } = this.props

    console.log("this current contact", this.currentContact())
    return (this.currentContact() && this.currentContact().messages().fetch().length === 0) ? assignment.campaign().initialScriptText() : ''
  }

  contactCount() {
    const { contacts, assignment } = this.props
    return contacts.length
  }

  hasPrevious() {
    return this.state.currentContactIndex > 0
  }

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1
  }

  handleNavigateNext() {
    if (this.hasNext()) {
      console.log("navigating next and has next")
      this.incrementCurrentContactIndex(1)
    }
    else {
      console.log("navigating next and does not have next")
      const { onStopTexting } = this.props
      onStopTexting()
    }
  }

  handleNavigatePrevious() {
    this.incrementCurrentContactIndex(-1)
  }

  setSuggestedScript(script)
  {
    this.setState({script})
  }
  handleScriptChange(script) {
    this.setSuggestedScript(script)
  }

  onSendMessage() {
    console.log("on send mesage?")
    this.handleNavigateNext()
  }

  handleOptOut() {
    const messageText = this.refs.optOutInput.getValue().trim()
    const { onNextContact } = this.props
    const onSuccess = () => {
      console.log("opting user out!")
      this.handleCloseDialog()
      onNextContact()
    }
    this.sendMessageToCurrentContact(messageText, onSuccess)
  }

  sendMessageToCurrentContact(text, onSuccess) {
    const { assignment } = this.props
    const contact = this.currentContact()
    sendMessage.call({
      text,
      campaignId: assignment.campaignId,
      contactNumber: contact.cell,
      userNumber: "18053959604"
    }, (error) => {
      if (error) {
        alert(error)
      } else {
        console.log("ON SUCCESS")
        onSuccess()
      }
    })
  }

  navigationTitle(contact) {
    return `${this.state.currentContactIndex + 1} of ${this.contactCount()}`
  }

  incrementCurrentContactIndex(increment) {
    let newIndex = this.state.currentContactIndex
    newIndex = newIndex + increment
    this.updateCurrentContactIndex(newIndex)
  }

  updateCurrentContactIndex(newIndex) {
    this.setState({
      currentContactIndex: newIndex
    })
  }

  getContact(contacts, index) {
    return (contacts.length > index) ? contacts[index] :  null
  }

  currentContact() {
    const { contacts } = this.props
    return this.getContact(contacts, this.state.currentContactIndex)
  }

  openOptOutDialog() {
    this.setState({open: true})
  }

  handleSurveyChange(surveyQuestionId, answer, script) {
    const contact = this.currentContact()
    updateAnswer.call({
      surveyQuestionId,
      value: answer,
      campaignContactId: contact._id
    })
    // This should actually happen from propagating props
    console.log("new script!", script)
    this.handleScriptChange(script)
  }

  renderSurveys(campaign) {
    return (this.currentContact().messages().fetch().length === 0 ) ? <div/> : (
      <div>
        <Divider />
        {campaign.surveys().map((survey) => (
          <QuestionDropdown
            answer={contact.surveyAnswer(survey._id)}
            onSurveyChange={this.handleSurveyChange.bind(this)}
            survey={survey}
          />
        ))}
        <Divider />
      </div>
    )
  }
  render() {
    const { assignment, contacts, onStopTexting } = this.props
    const contact = this.currentContact()
    console.log("CONTACTS", contacts)
    console.log("THE CONTACT IS", contact)
    if (!contact) {
      return null
    }

    const campaign = assignment.campaign()
    const scriptFields = campaign.scriptFields()
    //TODO - do we really want to grab all messages at once here? should I actually be doing a collection serach
    const leftToolbarChildren = [
      <ToolbarSeparator />,
      <ResponseDropdown
        responses={campaign.faqScripts || []}
        onScriptChange={this.handleScriptChange}
      />
    ]

    const rightToolbarChildren = [
      <ToolbarTitle style={styles.navigationToolbarTitle} text={this.navigationTitle()} />,
      <IconButton onTouchTap={this.handleNavigatePrevious}
        disabled={!this.hasPrevious()}
        style={styles.toolbarIconButton}
      >
        <NavigateBeforeIcon />
      </IconButton> ,
      <IconButton
        onTouchTap={this.handleNavigateNext}
        disabled={!this.hasNext()}
        style={styles.toolbarIconButton}
      >
        <NavigateNextIcon />
      </IconButton>
    ]

    const secondaryToolbar = this.renderSurveys(campaign)

    return (
      <div style={{height: '100%'}}>
        <ContactToolbar
          campaignContact={contact}
          onOptOut={this.handleNavigateNext}
          rightToolbarIcon={(
            <IconButton
              onTouchTap={onStopTexting}
              style={styles.toolbarIconButton}
            >
              <NavigateCloseIcon />

            </IconButton>
          )}
          style={styles.contactToolbar}
        />

        <Divider />

        <div style={styles.paper}>
          <MessageForm
            onSendMessage={this.onSendMessage}
            leftToolbarChildren={leftToolbarChildren}
            rightToolbarChildren={rightToolbarChildren}
            campaignContact={contact}
            initialScript={applyScript(this.state.script, contact, scriptFields)}
            secondaryToolbar={secondaryToolbar}
          />
        </div>
      </div>
    )
  }
}

AssignmentTexter.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array,   // contacts for current assignment
  onStopTexting: React.PropTypes.func
}


