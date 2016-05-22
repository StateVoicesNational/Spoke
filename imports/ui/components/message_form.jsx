import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import RaisedButton from 'material-ui/RaisedButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import Divider from 'material-ui/Divider'

import { ContactToolbar } from './contact_toolbar'
import { MessagesList } from './messages_list'
import { SurveyList } from './survey_list'
import { MessageField } from './message_field'
import { ResponseDropdown } from './response_dropdown'

import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'

const styles = {
  navigationToolbar: {
    backgroundColor: 'white'
  },
  navigationToolbarTitle: {
    fontSize: "12px"
  }
}

export class MessageForm extends Component {
  handleSendMessage(event) {
    event.preventDefault()
    const input = this.refs.input
    const onSuccess =  this.props.onSendMessage
    this.sendMessageToCurrentContact(input.getValue().trim(), onSuccess)
  }

  sendMessageToCurrentContact(text, onSendMessage) {
    const { campaignContact } = this.props
    sendMessage.call({
      text,
      campaignId: campaignContact.campaignId,
      contactNumber: campaignContact.cell,
    }, (error) => {
      if (error) {
        alert(error)
      } else {
        if (onSendMessage)
        {
          onSendMessage()
        }
      }
    })
  }

  navigationTitle(contact) {
    return `${this.state.currentContactIndex + 1} of ${this.contactCount()}`
  }

  renderSurvey() {
    return
    const { assignment } = this.props
    return [
      <SurveyList onScriptChange={this.handleScriptChange}
        contact= {this.currentContact()}
        survey={assignment.campaign().survey()}
      />
    ]
  }

  renderNavigationToolbar() {
    //   return <Toolbar style={styles.navigationToolbar}>
    //   <ToolbarGroup firstChild>
    //     <RaisedButton
    //       onClick={this.handleSendMessage}
    //       label="Send"
    //       primary
    //     />
    //     <ToolbarSeparator />
    //     <ResponseDropdown
    //       responses={assignment.campaign().faqScripts || []}
    //       onScriptChange={this.handleScriptChange}
    //     />
    //   </ToolbarGroup>
    //   <ToolbarGroup float="right">
    //     <ToolbarTitle style={styles.navigationToolbarTitle} text={this.navigationTitle()} />
    //     <IconButton onTouchTap={this.handleNavigatePrevious}
    //       disabled={!this.hasPrevious()}
    //     >
    //       <NavigateBeforeIcon />
    //     </IconButton>
    //     <IconButton onTouchTap={this.handleNavigateNext}
    //       disabled={!this.hasNext()}
    //     >
    //       <NavigateNextIcon />
    //     </IconButton>
    //   </ToolbarGroup>
    // </Toolbar>
    return (
      <Toolbar style={styles.navigationToolbar}>
        <ToolbarGroup firstChild>
          <RaisedButton
            onClick={this.handleSendMessage.bind(this)}
            label="Send"
            primary
          />
        </ToolbarGroup>
      </Toolbar>
    )
  }
  render() {
    const { campaignContact, initialScript } = this.props
    const messages = campaignContact.messages().fetch()
    return (
      <Paper>
        <ContactToolbar
          campaignContact={campaignContact}
        />
        <Divider />
        <MessagesList messages={messages} />
        <Divider />
        {this.renderSurvey()}
        <MessageField ref="input" initialScript={initialScript} />
        {this.renderNavigationToolbar()}
      </Paper>
    )

  }
}

MessageForm.propTypes = {
  initialScript: React.PropTypes.string,      // current assignment
  campaignContact: React.PropTypes.object  // contacts for current assignment
}
