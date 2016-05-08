import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import Badge from 'material-ui/Badge';

import { insert } from '../../api/campaigns/methods'
import { findScriptVariable } from '../helpers/script_helpers'
import { ScriptEditor } from './script_field'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'

const styles = {
  button: {
    margin: 12
  },
  exampleImageInput: {
    cursor: 'pointer',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: '100%',
    opacity: 0
  }
}

export class CampaignForm extends Component {
  constructor(props) {
    super(props)
    this.handleUpload = this.handleUpload.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleOpenScriptDialog = this.handleOpenScriptDialog.bind(this)
    this.handleCloseScriptDialog = this.handleCloseScriptDialog.bind(this)
    this.handleScriptSubmit = this.handleScriptSubmit.bind(this)
    this.onScriptChange = this.onScriptChange.bind(this)
    this.resetState()
  }

  resetState() {
    this.state = {
      uploading: false,
      contacts: [],
      customFields: [],
      scriptDialogOpen: true,
      script: ''
    }
  }

  handleSubmit() {
    const title = this.refs.title.getValue().trim()
    const description = this.refs.title.getValue().trim()

    const { contacts, script } = this.state

    const data = {
      title,
      description,
      contacts,
      script
    }

    insert.call(data, (err) => {
      if (err) {
        console.log(err)
      } else {
        this.props.onRequestClose()
        this.resetState()
      }
    })

  }

  handleUpload(event) {
    event.preventDefault()
    parseCSV(event.target.files[0], ({ contacts, customFields }) => {
      this.setState({
        contacts,
        customFields
      })

    })

  }

  handleOpenScriptDialog() {
    this.setState({ scriptDialogOpen: true })
  }
  handleCloseScriptDialog() {
    this.setState({ scriptDialogOpen: false })
  }

  onScriptChange(script) {
    console.log("onscript change", script)
    this.setState({ script })
  }

  handleScriptSubmit() {
    console.log("script change!", this.state.script)
    this.handleCloseScriptDialog()
  }

  renderScriptDialogOptions() {
    return [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleCloseScriptDialog}
        primary={false}
      />,
      <FlatButton
        label="Done"
        onTouchTap={this.handleScriptSubmit}
        primary
        keyboardFocused
      />
    ]
  }

  renderDialogActions() {
    return [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleCloseDialog}
        primary
      />,
      <FlatButton
        label="Save"
        onTouchTap={this.handleSubmit}
        primary
        keyboardFocused
      />
    ]
  }

  renderScriptSection() {
    return (this.state.contacts.length === 0) ? '' : (
      <div>
        <RaisedButton
          label="Add script"
          labelPosition="before"
          style={styles.button}
          onClick={this.handleOpenScriptDialog}
        />
        {this.renderScriptForm()}
      </div>
    )
  }

  renderUploadSection() {
    const { contacts } = this.state
    const contactsUploaded = contacts.length > 0

    const uploadButton = <RaisedButton
      label= "Upload contacts"
      labelPosition="before"
      style={styles.button}
    >
      <input type="file" style={styles.exampleImageInput} onChange={this.handleUpload}/>
    </RaisedButton>

    const reuploadButton = <div>
      <span>{contacts.length} contacts</span>
      <FlatButton
        label="Re-upload"
        primary
      >
        <input type="file" style={styles.exampleImageInput} onChange={this.handleUpload}/>
      </FlatButton>
      </div>

    return contactsUploaded ? reuploadButton : uploadButton
  }
  renderScriptForm() {
    return (<Dialog actions={this.renderScriptDialogOptions()}
      title="Create script"
      modal={true}
      open={this.state.scriptDialogOpen}
      onRequestClose={this.handleCloseScriptDialog}
      autoScrollBodyContent={true}
    >

      <ScriptEditor
        customFields={this.state.customFields}
        onScriptChange={this.onScriptChange}
      />

      { this.state.customFields.map((field) => <div>{field}</div>)}
    </Dialog>)
  }
  render() {
    const { contacts } = this.state
    const { open, onRequestClose } = this.props

    return (
      <div>
        <TextField
          fullWidth
          ref="title"
          floatingLabelText="Title"
        />
        <TextField
          fullWidth
          ref="description"
          floatingLabelText="Description"
        />
        {this.renderUploadSection()}
        {this.renderScriptSection()}
      </div>
    )
  }
}
