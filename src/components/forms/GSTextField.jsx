import React from "react";
import TextField from "@material-ui/core/TextField";
import GSFormField from "./GSFormField";
import theme from "../../styles/mui-theme";

export default class GSTextField extends GSFormField {
  render() {
    const {
      autoComplete,
      autoFocus,
      classes,
      color,
      defaultValue,
      disabled,
      error,
      fullWidth,
      helperText,
      id,
      InputLabelProps,
      inputProps,
      InputProps,
      inputRef,
      label,
      margin,
      multiline,
      name,
      onChange,
      onFocus,
      onBlur,
      placeholder,
      required,
      rows,
      rowsMax,
      select,
      SelectProps,
      size,
      type,
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
      fullWidth,
      helperText,
      id,
      InputLabelProps,
      inputProps,
      InputProps,
      inputRef,
      label,
      margin,
      multiline,
      name,
      onBlur,
      placeholder,
      required,
      rows,
      rowsMax,
      select,
      SelectProps,
      size,
      type,
      value,
      variant,
      style
    };
    // can't be undefined or react throw uncontroled component error
    if (!textFieldProps.value) {
      textFieldProps.value = "";
    }
    textFieldProps.style = Object.assign(
      {},
      { marginBottom: theme.spacing(2) },
      textFieldProps.style
    );

    const dataTest = { "data-test": this.props["data-test"] };
    return (
      <TextField
        {...dataTest}
        label={this.floatingLabelText()}
        onFocus={event => {
          event.target.select();
          if (onFocus) {
            onFocus(event);
          }
        }}
        {...textFieldProps}
        onChange={event => {
          onChange(event.target.value);
        }}
        type="text"
      />
    );
  }
}
