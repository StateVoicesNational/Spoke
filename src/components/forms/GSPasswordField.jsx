import React from "react";
import TextField from "@material-ui/core/TextField";
import GSFormField from "./GSFormField";

export default class GSPasswordField extends GSFormField {
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
      rowsMax,
      select,
      SelectProps,
      size,
      value,
      variant,
      style
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
      rowsMax,
      select,
      SelectProps,
      size,
      value,
      variant,
      style
    };
    // can't be undefined or react throw uncontroled component error
    if (!textFieldProps.value) {
      textFieldProps.value = "";
    }
    return (
      <TextField
        label={this.floatingLabelText()}
        onFocus={event => event.target.select()}
        {...textFieldProps}
        onChange={event => {
          onChange(event.target.value);
        }}
        type="password"
      />
    );
  }
}
