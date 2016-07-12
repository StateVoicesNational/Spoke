import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import { List, ListItem } from 'material-ui/List'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import CreateIcon from 'material-ui/svg-icons/content/create'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider'
import Dialog from 'material-ui/Dialog'
import {CannedResponseForm} from './canned_response_form'
import { insert, update, remove } from '../../api/scripts/methods'

const styles = {
  dialog: {
    zIndex: 10001
  }
}

export class ScriptList extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
      script: props.script,
      dialogOpen: false,
      popoverOpen: false,
    }
  }

  handleDeleteScript(scriptId) {
    remove.call({ scriptId }, (err) => {
      if (err) {
        alert(err)
      }
    })
  }

  handleEditScript(response) {
    const { duplicateCampaignResponses } = this.props
    const script = response
    if (!response.userId && duplicateCampaignResponses) {
      delete script['_id']
    }

    this.setState({
      script
    }, this.handleOpenDialog)
  }

  handleOpenDialog() {
    console.log("hi?!")
    this.setState({
      dialogOpen: true
    })
  }

  handleCloseDialog() {
    this.setState({
      dialogOpen: false,
      script: null
    })
  }

  handleSubmit() {
    const { script } = this.state
    const model = this.refs.form.getModel()

    const { onSaveScript } = this.props
    const callback = this.handleCloseDialog
    onSaveScript(script, model, callback)
  }

  render() {
    const { subheader, scripts, onSelectScript, duplicateCampaignResponses, showAddScriptButton, customFields } = this.props
    const { dialogOpen } = this.state

    const listItems = scripts.map((script) => (
      <ListItem
        value={script.text}
        onTouchTap={() => onSelectScript(script)}
        key={script._id}
        primaryText={script.title}
        secondaryText={script.text}
        rightIconButton={
          <IconMenu
            iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
            anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
            targetOrigin={{horizontal: 'left', vertical: 'bottom'}}
          >
            <MenuItem primaryText={duplicateCampaignResponses && !script.userId ? "Duplicate and edit" : "Edit"}
              onTouchTap={() => this.handleEditScript(script)}
            />
            {
              script.userId ? (
                <MenuItem primaryText="Delete"
                  onTouchTap={() => this.handleDeleteScript(script._id)}
                />
              ) : ''
            }
          </IconMenu>
        }
        secondaryTextLines={2}
      />
    ))


    const list = scripts.length === 0 ? null : (
      <List>
        <Subheader>{subheader}</Subheader>,
        { listItems}
        <Divider />
      </List>
    )

    return (
      <div>
        { list }
        { showAddScriptButton ? (
          <FlatButton
            secondary
            label="Add new canned response"
            icon={ <CreateIcon />}
            onTouchTap={this.handleOpenDialog}
          />
        ) : ''}
        <Dialog
          style={styles.dialog}
          open={dialogOpen}
          actions={[
            <FlatButton
              label="Cancel"
              onTouchTap={this.handleCloseDialog}
            />,
            <RaisedButton
              label="Save"
              type="submit"
              disabled={!this.state.doneButtonEnabled}
              onTouchTap={this.handleSubmit}
              primary
            />
          ]}
          onRequestClose={this.handleCloseDialog}
        >
          <CannedResponseForm
            ref="form"
            customFields={customFields}
            script={this.state.script}
            onValid={() => this.setState( { doneButtonEnabled: true })}
            onInvalid={() => this.setState( { doneButtonEnabled: false })}
          />
        </Dialog>
      </div>
    )
  }
}
