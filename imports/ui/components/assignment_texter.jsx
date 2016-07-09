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
import { AssignmentTexterSurveys} from './assignment_texter_surveys'

import { MessageForm } from './message_form'
import { ResponseDropdown } from './response_dropdown'

import { Scripts } from '../../api/scripts/scripts'
import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'
import { updateAnswers } from '../../api/survey_answers/methods'
import { ZipCodes } from '../../api/zip_codes/zip_codes'
import { MessagesList } from './messages_list'
import { grey100 } from 'material-ui/styles/colors'

// .Site {
//   display: flex;
//   flex-direction: column;
//   height: 100%; /* 1, 3 */
// }

// .Site-header,
// .Site-footer {
//   flex: none; /* 2 */
// }

// .Site-content {
//   flex: 1 0 auto; /* 2 */
//   padding: var(--space) var(--space) 0;
//   width: 100%;
// }

const styles = {
  root: {
    margin:0,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  navigationToolbarTitle: {
    fontSize: "12px"
  },
  topToolbar: {
    flex: '0 0 auto',
  },
  messageList: {
    flex: '1 1 auto',
    overflowY: 'scroll'
  },
  bottomToolbar: {
    borderTop: `1px solid ${grey100}`,
    flex: '0 0 auto',
  }
}

// html, body {
//   height:100%;
//   min-height:100%;
//   overflow: hidden;
// }

// body {
//   display: flex;
//   flex-direction: column;
// }

// .StickyHeader, .StickyFooter {
//   flex: 0 0 auto;
//   background: red;
// }

// .StickyContent {
//   flex: 1 1 auto;
//   overflow-y: scroll;
//   background: green;
// }
export class AssignmentTexter extends Component {
  constructor(props) {
    super(props)

    this.state = {
      currentContactIndex: 0,
      script: '',
    }

    this.handleNavigateNext = this.handleNavigateNext.bind(this)
    this.handleNavigatePrevious = this.handleNavigatePrevious.bind(this)
    this.onSendMessage = this.onSendMessage.bind(this)
    this.handleScriptChange = this.handleScriptChange.bind(this)

    console.log("hi")
    this.state.script = this.defaultScript()

  }

  componentDidUpdate(prevProps, prevState) {
    // TODO: This needs to be in a child component with state.
    const prevContact = this.getContact(prevProps.contacts, prevState.currentContactIndex)
    const newContact = this.currentContact()
    if (newContact && (!prevContact || (prevContact._id !== newContact._id))) {
      console.log("here?")
      this.setSuggestedScript(this.defaultScript())
    }

    // FIXME scroll to bottom of converatiosn
    // componentDidMount() {
    //   const node = this.refs.scrollContainer
    //   if (node) {
    //     node.scrollTop = node.scrollHeight
    //   }
    // }


  }

  defaultScript() {
    const { assignment } = this.props
    const contact = this.currentContact()
    console.log(assignment.campaign().initialScriptText())
    return (contact && contact.messages().fetch().length === 0) ? assignment.campaign().initialScriptText() : ''
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
    console.log("hi?")
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
    console.log("setting script", script)
    this.setState({script})
  }
  handleScriptChange(script) {
    this.setSuggestedScript(script)
  }

  onSendMessage() {
    const contact = this.currentContact()
    updateAnswers.call({
      answers: this.refs.surveySection.answers(),
      campaignContactId: contact._id,
      campaignId: contact.campaignId
    }, (err) => {
      if (err) {
        alert(err)
      } else {
        this.handleNavigateNext()
      }
    })
  }

  handleOptOut() {
    const messageText = this.refs.optOutInput.getValue().trim()
    const { onNextContact } = this.props
    const onSuccess = () => {
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
      userNumber: "18053959604",
      timezoneOffset: contact.utcOffset()
    }, (error) => {
      if (error) {
        console.log("naotheusntahoeusnahtoeu")
        console.log("ERROR", error)
        // alert(error)
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

  renderSurveySection(campaign) {
    const contact = this.currentContact()

    // return contact.messages().fetch().length === 0  ? <div/> :
    return (
      <AssignmentTexterSurveys
        contact={contact}
        initialStep={campaign.firstStep()}
        onScriptChange={this.handleScriptChange}
      />
    )
  }

  render() {
    const { assignment, contacts, onStopTexting } = this.props
    const contact = this.currentContact()
    if (!contact) {
      return null
    }

    const campaign = assignment.campaign()
    const scriptFields = campaign.scriptFields()
    const faqScripts = Scripts.find( { $or: [
      {campaignId: campaign._id,  userId: null },
      { campaignId: campaign._id,  userId: Meteor.userId() }
    ] })
    //TODO - do we really want to grab all messages at once here? should I actually be doing a collection serach
    const leftToolbarChildren = [
      <ToolbarSeparator />,
      <ResponseDropdown
        responses={faqScripts}
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

    const secondaryToolbar = this.renderSurveySection(campaign)

    const appliedScript = applyScript(this.state.script, contact, scriptFields)
    console.log("appliedScript", appliedScript)
    return (
      <div style={styles.root}>
        <div style={styles.topToolbar}>
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
          />
        </div>
        <div
          style={styles.messageList}
          ref="messageListContainer"
        >
          <MessagesList
            contact={contact}
            messages={contact.messages().fetch()}
          />
        </div>
        <div style={styles.bottomToolbar}>
          <MessageForm
            onSendMessage={this.onSendMessage}
            leftToolbarChildren={leftToolbarChildren}
            rightToolbarChildren={rightToolbarChildren}
            campaignContact={contact}
            initialScript={appliedScript}
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


