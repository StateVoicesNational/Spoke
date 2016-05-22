import React, { Component } from 'react'
import IconButton from 'material-ui/IconButton/IconButton'
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import { MessagesList } from './messages_list'
import { SurveyList } from './survey_list'
import { MessageField } from './message_field'
import { sendMessage } from '../../api/messages/methods'

export class ContactToolbar extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleOptOut = this.handleOptOut.bind(this)

    this.state = {
      open: false
    }
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

  render() {
    const { campaignContact } = this.props

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
      />
    ]

    const optOutScript = "I'm opting you out of text-based communication immediately. Have a great day."

    return (
        <Toolbar>
          <ToolbarGroup float="left">
            <ToolbarTitle text={`${campaignContact.firstName} - ${campaignContact.cell}`} />
          </ToolbarGroup>
          <ToolbarGroup float="right">
            <IconButton onTouchTap={this.handleOpenDialog}>
              <DeleteIcon tooltip="Opt out" />
            </IconButton>
          </ToolbarGroup>
          <Dialog
            title="Opt out user"
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={this.handleCloseDialog}
          >
            <MessageField ref="optOutInput" initialScript={optOutScript} />
          </Dialog>
        </Toolbar>
    )
  }
}

ContactToolbar.propTypes = {
  campaignContact: React.PropTypes.object,   // contacts for current assignment
}

