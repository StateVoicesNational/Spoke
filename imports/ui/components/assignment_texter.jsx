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

import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'

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
    console.log("after set suggested script in cronstrucotr", this.state)

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
    return (this.currentContact() && this.currentContact().messages().fetch().length === 0) ? assignment.campaign().script : ''
  }

  contactCount() {
    const { contacts, assignment } = this.props
    console.log("contacts passed to AssignmentSummary", contacts, assignment, assignment.contacts().fetch())
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
      this.incrementCurrentContactIndex(1)
    }
    else {
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
  renderSurvey() {
    const { assignment } = this.props
    return [
      <SurveyList onScriptChange={this.handleScriptChange}
        contact= {this.currentContact()}
        survey={assignment.campaign().survey()}
      />
    ]
  }

  render() {
    const { assignment, contacts, onStopTexting } = this.props
    const contact = this.currentContact()
    if (!contact) {
      return ''
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

    const secondaryToolbar = (
      <SurveyList onScriptChange={this.handleScriptChange}
        contact= {this.currentContact()}
        survey={campaign.survey()}
      />
    )

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


