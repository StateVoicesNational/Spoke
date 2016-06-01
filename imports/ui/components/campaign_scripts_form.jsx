import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'
import {Table, TableBody, TableRow, TableRowColumn} from 'material-ui/Table'
import Dialog from 'material-ui/Dialog'

export class CampaignScriptsForm extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)

    this.state = {
      open: false
    }
  }

  handleOpenDialog() {
    this.setState({ open: true })
  }

  handleCloseDialog() {
    this.setState({ open: false })
  }

  render() {
    const {
      faqScripts,
      script,
      handleAddScriptRow,
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
                {script ? script.script : ''}
              </TableRowColumn>
              <TableRowColumn>
                  <FlatButton
                    label={script ? 'Edit' : 'Add script'}
                    // onTouchTap={handleAddScriptRow}
                    secondary
                  />
              </TableRowColumn>
            </TableRow>
            {faqScripts.map((faqScript) => (
                <TableRow>
                  <TableRowColumn>{faqScript.title}</TableRowColumn>
                  <TableRowColumn>{faqScript.script}</TableRowColumn>
                </TableRow>
            ))}
          </TableBody>
        </Table>
        <FlatButton
          label={'Add saved reply'}
          onTouchTap={this.handleOpenDialog}
          secondary
        />

        <Dialog
          actions={[
            <FlatButton
              label="Cancel"
              onTouchTap={this.handleCloseDialog}
            />,
            <RaisedButton
              label="Done"
              // onTouchTap={handleAddScriptRow}
              primary
            />
          ]}
          modal
          open={this.state.open}
          onRequestClose={this.handleCloseDialog}
        >
          <ScriptEditor
            expandable
            script={script}
            sampleContact={sampleContact}
            customFields={customFields}
            onScriptChange={onScriptChange}
            onScriptDelete={onScriptDelete}
          />
        </Dialog>
      </div>
    )
    return (
      <div>
        <Subheader>Default script</Subheader>
          {this.renderScriptRow(script)}
        <Subheader>Saved replies</Subheader>
          { faqScripts.map((faqScript) => this.renderScriptRow(faqScript))}
        <FlatButton
          label="Add saved reply"
          onTouchTap={handleAddScriptRow}
          secondary
        />
      </div>
    )
  }
}
