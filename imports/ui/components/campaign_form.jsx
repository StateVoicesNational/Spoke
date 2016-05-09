import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import Badge from 'material-ui/Badge';
import Divider from 'material-ui/Divider';


import { insert } from '../../api/campaigns/methods'
import { findScriptVariable } from '../helpers/script_helpers'
import { ScriptEditor } from './script_field'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'

const styles = {
  button: {
    margin: '24px 5px 24px 0',
    fontSize: '10px'
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
  },
  scriptSection: {
    marginTop: 24
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
      scriptDialogOpen: false,
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
    ]
  }

  renderDialogActions() {
    return [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleCloseDialog}
        primary
      />,
    ]
  }

  renderScriptSection() {
    // const showScriptSection = this.state.contacts.length === 0
    const hideScriptSection = false
    return hideScriptSection ? '' : (
      <div>
        <Divider />
          <h2>Scripts</h2>
        {this.renderScriptForm()}
      </div>
    )
  }

  renderUploadSection() {
    const { contacts } = this.state
    const contactsUploaded = contacts.length > 0
    return (
      <div>
        <RaisedButton
          style={styles.button}
          label= "Upload contacts"
          labelPosition="before"
        >
          <input type="file" style={styles.exampleImageInput} onChange={this.handleUpload}/>
        </RaisedButton>

        {contactsUploaded ? (<span>{`${contacts.length} contacts uploaded`}</span>) : ''}
      </div>
    )
  }

  formValid() {
    return this.state.contacts.length > 0 && this.state.script !== ''
  }

  renderSaveButton() {
    return !this.formValid() ? '' : <FlatButton
      label="Save"
      onTouchTap={this.handleSubmit}
      primary
      keyboardFocused
    />
  }

  renderScriptForm() {
    return (
      <div style={styles.scriptSection}>
        <ScriptEditor
          sampleContact={this.state.contacts[0]}
          customFields={this.state.customFields}
          onScriptChange={this.onScriptChange}
        />

        <FlatButton
          label="Cancel"
          onTouchTap={this.handleCloseScriptDialog}
        />,
        <FlatButton
          label="Add script"
          onTouchTap={this.handleScriptSubmit}
          secondary
        />
      </div>
    )
    return (<Dialog actions={this.renderScriptDialogOptions()}
      title="Create script"
      modal={true}
      open={this.state.scriptDialogOpen}
      onRequestClose={this.handleCloseScriptDialog}
      autoScrollBodyContent={true}
    >
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
        {this.renderSaveButton()}
      </div>

    )
  }
}
