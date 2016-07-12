import { ScriptEditor } from './script_editor'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'
import React, { Component } from 'react'
import { allScriptFields } from '../../api/scripts/scripts'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
const styles = {
  dialog: {
    zIndex: 10001
  }
}
export class ScriptField extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleSaveScript = this.handleSaveScript.bind(this)

    this.state = {
      open: false,
      value: props.value
    }
  }

  handleSaveScript() {
    const value =  this.refs.dialogScriptInput.getValue()
    this.setState({ value })
    this.refs.input.setState({ value }, () => {
      const { onChange } = this.props
      // FIXME: This should have an event and it does not
      onChange()
      this.handleCloseDialog()
    })
  }

  renderDialog() {
    const { open } = this.state
    const { customFields, sampleContact } = this.props
    const scriptFields = allScriptFields(customFields)

    return (
      <Dialog
        style={styles.dialog}
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
        open={open}
        onRequestClose={this.handleCloseDialog}
      >
        <ScriptEditor
          expandable
          ref="dialogScriptInput"
          // scriptText={this.refs.input.getValue()}
          scriptText={this.state.value}
          sampleContact={sampleContact}
          scriptFields={scriptFields}

        />
      </Dialog>
    )
  }

  handleOpenDialog(event) {
    event.stopPropagation()
    event.preventDefault()
    debugger
    this.setState({
      open: true
    }, () => this.refs.dialogScriptInput.focus())
  }

  handleCloseDialog() {
    this.setState({
      open: false
    })
  }

  render() {
    return (
      <div>
        <FormsyText
          ref="input"
          onFocus={this.handleOpenDialog}
          onTouchTap={(event) => {
            console.log("event.preventDefault")
            event.stopPropagation()
        }}
          {...this.props}
          value={this.state.value}
        />
        {this.renderDialog()}
      </div>
    )
}
}