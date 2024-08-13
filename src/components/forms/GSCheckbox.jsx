import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import GSFormField from "./GSFormField";
import theme from "../../styles/mui-theme";
import FormControlLabel from "@material-ui/core/FormControlLabel";

export default class GSCheckbox extends GSFormField {
  render() {
    const {
      onChange,
      onFocus,
      onBlur,
      value,
    } = this.props;

    const dataTest = { "data-test": this.props["data-test"] };
    return (
        <FormControlLabel
          label={this.floatingLabelText()}
          control={<Checkbox
            {...dataTest}
            checked={value===true}
            onFocus={event => {
              event.target.select();
              if (onFocus) {
                onFocus(event);
              }
            }}
            onChange={event => {
              onChange(event.target.checked);
            }}
            type="checkbox"
          />
          }
        />
    );
  }
}
/*
      <Checkbox
        {...dataTest}
        label={this.floatingLabelText()}
        onFocus={event => {
          event.target.select();
          if (onFocus) {
            onFocus(event);
          }
        }}
        onChange={event => {
          onChange(event.target.value);
        }}
        type="checkbox"
      />

 */