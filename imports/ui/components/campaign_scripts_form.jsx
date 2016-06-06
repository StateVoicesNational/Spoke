import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'
import Subheader from 'material-ui/Subheader'
import { Table, TableBody, TableRow, TableRowColumn } from 'material-ui/Table'
import Dialog from 'material-ui/Dialog'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { ScriptTypes } from '../../api/campaigns/scripts'
import TextField from 'material-ui/TextField'
import Divider from 'material-ui/Divider'
import { muiTheme } from '../../ui/theme'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'

const styles = {
  scriptRow: {
    padding: 15,
    marginBottom: 40,
    borderLeft: `5px solid ${muiTheme.palette.primary1Color}`
  },
  scriptTitle: {
    fontWeight: 'medium'
  },
  scriptSectionSubtitle: {
    color: 'gray',
    fontWeight: 'light',
    marginTop: 0,
    marginBottom: 36,
    fontSize: 12
  },
  scriptSectionTitle: {
    marginBottom: 0
  }
}
export class CampaignScriptsForm extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleSaveScript = this.handleSaveScript.bind(this)
    this.handleAddScript = this.handleAddScript.bind(this )
    this.state = {
      open: false
    }
  }

  handleOpenDialog() {
    this.setState({ open: true })
  }

  handleCloseDialog() {
    this.setState({ open: false, editingScript: null })
  }

  handleSaveScript() {
    const script = {
      title: this.refs.titleInput.getValue(),
      text: this.refs.scriptInput.getValue(),
      type: ScriptTypes.FAQ
    }

    const { handleAddScript } = this.props
    handleAddScript(script)
    this.handleCloseDialog()
  }

  handleAddScript() {
    const script = {}
    this.setState({ editingScript: script } )
    this.handleOpenDialog()

  }

  handleEditScript(script) {
    this.setState( { editingScript: script })
  }

  renderDialog() {
    const {
      faqScripts,
      script,
      handleSaveScriptRow,
      onScriptChange,
      onScriptDelete,
      sampleContact,
      customFields } = this.props

    const scriptFields = CampaignContacts.requiredUploadFields.concat(CampaignContacts.userScriptFields).concat(customFields)
    return (
      <Dialog
        actions={[
          <FlatButton
            label="Cancel"
            onTouchTap={this.handleCloseDialog}
          />,
          <RaisedButton
            label="Done"
            onTouchTap={this.handleSaveScript}
            primary
          />
        ]}
        modal
        open={this.state.open}
        onRequestClose={this.handleCloseDialog}
      >
        <TextField
          floatingLabelText="Common issue"
          ref="titleInput"
          value={ script ? script.title : ''}
        />
        <ScriptEditor
          // value={ script ? script.text : ''}
          expandable
          ref="scriptInput"
          script={this.state.editingScript}
          sampleContact={sampleContact}
          scriptFields={scriptFields}
        />
      </Dialog>
    )
  }

  renderScriptRow(script) {
    return (script ? (
      <div style={styles.scriptRow}>
        <span style={styles.scriptTitle}>
          {script.title}
        </span>
        <div>
          {script.text}
        </div>
      </div>
    ) : (
        <RaisedButton
          label={'Add script'}
          onTouchTap={this.handleAddScript }
        />
      )
    )
  }
  render() {
    const {
      faqScripts,
      script,
      handleSaveScriptRow,
      onScriptChange,
      onScriptDelete,
      sampleContact,
      customFields } = this.props

    const sectionHeading = (title, subtitle) => [
      <h3 style={styles.scriptSectionTitle}>{title}</h3>,
      <h4 style={styles.scriptSectionSubtitle}>{subtitle}</h4>
    ]
    return (
      <div>
        <CampaignFormSectionHeading
          title='What do you want to say?'
        />
        { sectionHeading('First message script', "This script is what we'll automatically fill in for texters when they first send the first message to a contact.")}
        { this.renderScriptRow(script)}
        <Divider />
        { sectionHeading('Saved replies', "These replies will appear in a list for texters to choose to answer common issues and questions when a contact has responded. You can think of it as a FAQ section of sorts.")}
        { faqScripts.map((faqScript) => this.renderScriptRow(faqScript))}
        <RaisedButton
          label={'Add saved reply'}
          onTouchTap={this.handleAddScript }
        />
        { this.renderDialog()}
      </div>
    )
  }
}
