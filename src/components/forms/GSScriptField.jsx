import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import GSFormField from "./GSFormField";
import { allScriptFields } from "../../lib/scripts";
import ScriptEditor from "../ScriptEditor";
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
    this.dialogScriptInput = React.createRef();
    this.dialogScriptText = React.createRef();
  }

  handleOpenDialog = event => {
    event.stopPropagation();
    event.preventDefault();
    this.setState(
      {
        open: true,
        script: this.props.value
      },
      () => {
        this.dialogScriptInput.current &&
          this.dialogScriptInput.current.focus();
        this.dialogScriptText.current && this.dialogScriptText.current.blur();
      }
    );
  };

  handleCloseDialog = () => {
    this.setState({ open: false });
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
        open={open}
        onClose={this.handleCloseDialog}
      >
        <DialogContent>
          <ScriptEditor
            expandable
            ref={this.dialogScriptInput}
            scriptText={this.state.script}
            sampleContact={sampleContact}
            scriptFields={scriptFields}
            onChange={val => this.setState({ script: val })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            {...dataTest("scriptCancel")}
            onClick={this.handleCloseDialog}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            {...dataTest("scriptDone")}
            onClick={this.handleSaveScript}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  render() {
    const {
      fullWidth,
      label,
      multiline,
      name,
      onChange,
      value,
      ref
    } = this.props;
    const dataTest = { "data-test": this.props["data-test"] };
    return (
      <div>
        <TextField
          {...dataTest}
          inputRef={ref}
          inputRef={this.dialogScriptText}
          onClick={event => {
            this.handleOpenDialog(event);
          }}
          onFocus={event => {
            this.handleOpenDialog(event);
          }}
          label={this.floatingLabelText()}
          fullWidth={fullWidth}
          label={label}
          multiline={multiline}
          name={name}
          onChange={onChange}
          value={value}
        />
        {this.renderDialog()}
      </div>
    );
  }
}
