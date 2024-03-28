import React from "react";
import TextField from "@material-ui/core/TextField";
import GSFormField from "./GSFormField";
import { ChromePicker } from "react-color";
import theme from "../../styles/mui-theme";

export default class GSTextField extends GSFormField {
  state = {};

  renderPicker(value) {
    return (
      <React.Fragment>
        <div
          onClick={() => {
            this.setState({ showPicker: false });
          }}
          style={{
            position: "absolute",
            zIndex: 9998,
            top: 0,
            left: 0,
            right: 0,
            height: document.body.scrollHeight,
            outline: "10px solid green"
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            zIndex: 9999
          }}
        >
          <ChromePicker
            color={this.state.color || value}
            onChange={evt => {
              this.setState({ color: evt.hex });
            }}
            onChangeComplete={evt => {
              this.setState({ color: undefined });
              this.props.onChange(evt.hex);
            }}
          />
        </div>
      </React.Fragment>
    );
  }

  render() {
    const {
      autoComplete,
      autoFocus,
      classes,
      color,
      defaultValue,
      disabled,
      error,
      FormHelperTextProps,
      fullWidth,
      helperText,
      id,
      InputLabelProps,
      inputProps,
      InputProps,
      inputRef,
      margin,
      multiline,
      name,
      onChange,
      placeholder,
      required,
      rows,
      maxRows,
      select,
      SelectProps,
      size,
      value,
      variant,
      style = {}
    } = this.props;
    const textFieldProps = {
      autoComplete,
      autoFocus,
      classes,
      color,
      defaultValue,
      disabled,
      error,
      FormHelperTextProps,
      fullWidth,
      helperText,
      id,
      InputLabelProps,
      inputProps,
      InputProps,
      inputRef,
      margin,
      multiline,
      name,
      placeholder,
      required,
      rows,
      maxRows,
      select,
      SelectProps,
      size,
      value,
      variant,
      style
    };
    const { showPicker } = this.state;
    // can't be undefined or react throw uncontroled component error
    if (!textFieldProps.value) {
      textFieldProps.value = "";
    }
    textFieldProps.style = Object.assign(
      {},
      { marginBottom: theme.spacing(2) },
      textFieldProps.style
    );
    const regex = new RegExp("^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$");
    const isValidColor = regex.test(textFieldProps.value);

    // only show the error state if it is required or a value has been entered
    const showError = this.props.required || textFieldProps.value;

    return (
      <div>
        <TextField
          label={this.floatingLabelText()}
          onFocus={event => {
            event.target.select();
            this.setState({ showPicker: true });
          }}
          {...textFieldProps}
          fullWidth
          error={(showError && !isValidColor) || textFieldProps.error}
          helperText={
            isValidColor || !showError
              ? textFieldProps.helperText
              : "Invalid color"
          }
          onChange={event => {
            onChange(event.target.value);
          }}
          type="text"
        />
        {showPicker && this.renderPicker(textFieldProps.value)}
      </div>
    );
  }
}
