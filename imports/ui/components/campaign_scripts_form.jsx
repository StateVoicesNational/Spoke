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
  render() {
    const {
      faqScripts,
      script,
      handleSaveScriptRow,
      onScriptChange,
      onScriptDelete,
      sampleContact,
      customFields } = this.props
    return (
      <div>
        <Table>
          <TableBody
            displayRowCheckbox={false}
          >
            <TableRow>
              <TableRowColumn>Default script</TableRowColumn>
              <TableRowColumn>
                {script ? script.text : ''}
              </TableRowColumn>
              <TableRowColumn>
                  <FlatButton
                    label={script ? 'Edit' : 'Add script'}
                    // onTouchTap={handleSaveScriptRow}
                    secondary
                  />
              </TableRowColumn>
            </TableRow>
            {faqScripts.map((faqScript) => (
                <TableRow>
                  <TableRowColumn>{faqScript.title}</TableRowColumn>
                  <TableRowColumn>{faqScript.text}</TableRowColumn>
                </TableRow>
            ))}
          </TableBody>
        </Table>
        <FlatButton
          label={'Add saved reply'}
          onTouchTap={this.handleAddScript }
          secondary
        />

        { this.renderDialog()}
      </div>
    )
  }
}
