import React from "react";
import GSFormField from "./GSFormField";
import { allScriptFields } from "../../lib/scripts";
import ScriptEditor from "../ScriptEditor";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";
import { dataTest } from "../../lib/attributes";

const styles = {
  dialog: {
    zIndex: 10001
  }
};

export default class GSScriptField extends GSFormField {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      script: props.value || ""
    };
  }

  handleOpenDialog = event => {
    event.stopPropagation();
    event.preventDefault();
    this.setState(
      {
        open: true,
        script: this.props.value
      },
      () => this.refs.dialogScriptInput.focus()
    );
  };

  handleCloseDialog = () => {
    this.setState({
      open: false
    });
  };

  handleSaveScript = () => {
    const value = this.state.script;
    this.props.onChange(value);
    this.handleCloseDialog();
  };

  renderDialog() {
    const { open } = this.state;
    const { customFields, sampleContact } = this.props;
    const scriptFields = allScriptFields(customFields);
    return (
      <Dialog
        style={styles.dialog}
        actions={[
          <FlatButton
            {...dataTest("scriptCancel")}
            label="Cancel"
            onTouchTap={this.handleCloseDialog}
          />,
          <RaisedButton
            {...dataTest("scriptDone")}
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
          scriptText={this.state.script}
          sampleContact={sampleContact}
          scriptFields={scriptFields}
          onChange={val => this.setState({ script: val })}
        />
      </Dialog>
    );
  }

  render() {
    return (
      <div>
        <TextField
          multiLine
          onTouchTap={event => {
            this.handleOpenDialog(event);
          }}
          onFocus={event => {
            this.handleOpenDialog(event);
          }}
          floatingLabelText={this.floatingLabelText()}
          floatingLabelStyle={{
            zIndex: 0
          }}
          {...this.props}
        />
        {this.renderDialog()}
      </div>
    );
  }
}
