import React from 'react'
import GSFormField from './GSFormField'
import { allScriptFields } from '../../lib/scripts'
import ScriptEditor from '../ScriptEditor'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import { dataTest } from '../../lib/attributes'

const styles = {
  dialog: {
    zIndex: 10001
  }
}

export default class GSScriptField extends GSFormField {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      script: props.value
    }
  }

  handleOpenDialog = (event) => {
    event.stopPropagation()
    event.preventDefault()
    this.setState({
      open: true
    }, () => this.refs.dialogScriptInput.focus())
  }

  handleCloseDialog = () => {
    this.setState({
      open: false,
      script: this.props.value
    })
  }

  handleSaveScript = () => {
    const value = this.state.script
    this.props.onChange(value)
    this.handleCloseDialog()
  }

  renderDialog() {
    const { open } = this.state
    const { customFields, sampleContact } = this.props
    const scriptFields = allScriptFields(customFields)

    return (
      <Dialog
        style={styles.dialog}
        modal={true}
        open={open}
        onRequestClose={this.handleCloseDialog}
      >
        <DialogContent>
          <ScriptEditor
            expandable
            ref='dialogScriptInput'
            scriptText={this.state.script}
            sampleContact={sampleContact}
            scriptFields={scriptFields}
            onChange={(val) => this.setState({ script: val })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            {...dataTest('scriptCancel')}
            onClick={this.handleCloseDialog}
          >
            Cancel
          </Button>,
          <Button
            {...dataTest('scriptDone')}
            variant='contained'
            onClick={this.handleSaveScript}
            primary
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  render() {
    return (
      <div>
        <TextField
          multiLine
          onFocus={this.handleOpenDialog}
          onClick={(event) => {
            event.stopPropagation()
          }}
          floatingLabelText={this.floatingLabelText()}
          floatingLabelStyle={{
            zIndex: 0
          }}
          {...this.props}
        />
        {this.renderDialog()}
      </div>
    )
  }
}
