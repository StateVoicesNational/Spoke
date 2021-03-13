import React from "react";
// import TextField from "material-ui/TextField";
import TextField from "@material-ui/core/TextField";
import GSFormField from "./GSFormField";

export default class GSTextField extends GSFormField {
  render() {
    // can't be undefined or react throw uncontroled component error
    let { value } = this.props;
    if (!value) {
      value = "";
    }
    return (
      <TextField
        label={this.floatingLabelText()}
        onFocus={event => event.target.select()}
        {...this.props}
        value={value}
        onChange={event => {
          this.props.onChange(event.target.value);
        }}
        type="text"
      />
    );
  }
}
