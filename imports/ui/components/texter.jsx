import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import Divider from 'material-ui/Divider'
import IconButton from 'material-ui/IconButton/IconButton'
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar'
import { MessagesList } from './messages_list'
import { SurveyList } from './survey_list'
import { MessageField } from './message_field'
import { ResponseDropdown } from './response_dropdown'
import { sendMessage } from '../../api/messages/methods'
import { applyScript } from '../helpers/script_helpers'

export class Texter extends Component {
  constructor(props) {
    super(props)
    this.handleSendMessage = this.handleSendMessage.bind(this)
    this.handleScriptChange = this.handleScriptChange.bind(this)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleOptOut = this.handleOptOut.bind(this)

    this.state = {
      script: '',
      open: false
    }
  }


  componentWillReceiveProps({assignment, messages}) {
    console.log("received props", assignment.campaign().script, messages)
    if (messages.length === 0) {
      const script = assignment.campaign().script
      console.log(script)
      this.setSuggestedScript({ script })
    }
  }

  setSuggestedScript(script) {
    this.setState({script})
  }

  sendMessageToCurrentContact(text, onSuccess) {
    if (!text) {
      return
    }

    const { contact, assignment, onNextContact } = this.props
    sendMessage.call({
      text,
      campaignId: assignment.campaignId,
      contactNumber: contact.number,
      userNumber: "18053959604"
    }, (error) => {
      if (error) {
        alert(error)
      } else {
        onSuccess()
      }
    })
  }

  handleOpenDialog() {
    this.setState({open: true})
  }

  handleCloseDialog() {
    this.setState({open: false})
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

  handleScriptChange(script) {
    this.setSuggestedScript(script)
  }

  handleSendMessage(event) {
    const { contact, messages, onNextContact } = this.props

    event.preventDefault()
    const input = this.refs.input
    const onSuccess =  () => {
      onNextContact()
      // if (messages.length === 0) {
      //   onNextContact()
      // } else {
      //   this.setState({ script: '' })
      // }
    }
    this.sendMessageToCurrentContact(input.getValue().trim(), onSuccess)
  }

  renderSurvey() {
    const { messages, contact, survey } = this.props
    if (messages.length === 0) {
      return ''
    } else {
      const lastMessage = messages[messages.length - 1]
      return [
        <SurveyList survey={survey}
          onScriptChange={this.handleScriptChange}
          contact= {contact}
          responseNeeded={ lastMessage.isFromContact } />,
        <Divider />
      ]
    }
  }

  render() {
    const { messages, contact, assignment } = this.props

    const actions = [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleCloseDialog}
        primary
      />,
      <FlatButton
        label="Send message and opt out user"
        onTouchTap={this.handleOptOut}
        primary
        keyboardFocused
      />
    ]

    const optOutScript = "I'm opting you out of text-based communication immediately. Have a great day."

    return (
      <div>
        <div className="row">
          <div className="col-xs-12 col-sm-3 col-md-2 col-lg-1">
            <div className="box-row">
            </div>
          </div>
          <div className="col-xs-6 col-sm-6 col-md-8 col-lg-10">
              <div className="box-row">
                <Paper>
                  <Toolbar>
                    <ToolbarGroup float="left">
                      <ToolbarTitle text={contact.name} />
                    </ToolbarGroup>
                    <ToolbarGroup float="right">
                      <IconButton onTouchTap={this.handleOpenDialog}>
                        <DeleteIcon tooltip="Opt out" />
                      </IconButton>
                      <Dialog
                        title="Opt out user"
                        actions={actions}
                        modal={false}
                        open={this.state.open}
                        onRequestClose={this.handleCloseDialog}
                      >
                        <MessageField ref="optOutInput" initialScript={applyScript(optOutScript, contact) } />
                      </Dialog>
                    </ToolbarGroup>
                  </Toolbar>
                  <Divider />

                  <MessagesList messages={messages} />
                  <Divider />
                  {this.renderSurvey()}
                  <MessageField ref="input" initialScript={applyScript(this.state.script, contact)} />
                  <Toolbar>
                    <ToolbarGroup firstChild>
                      <ResponseDropdown
                        responses={assignment.campaign().faqScripts}
                        onScriptChange={this.handleScriptChange}
                      />
                    </ToolbarGroup>
                    <ToolbarGroup>
                      <RaisedButton
                        onClick={this.handleSendMessage}
                        label="Send"
                        primary
                      />
                    </ToolbarGroup>
                  </Toolbar>
                </Paper>
              </div>
          </div>
        </div>
      </div>
    )
  }
}

Texter.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  messages: React.PropTypes.array,   // all assignments for showing in sidebar
  contact: React.PropTypes.object,   // contacts for current assignment
  survey: React.PropTypes.object,   // survey for current assignment
}

