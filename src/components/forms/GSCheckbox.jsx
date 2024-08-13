import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import GSFormField from "./GSFormField";
import FormControlLabel from "@material-ui/core/FormControlLabel";

export default class GSCheckbox extends GSFormField {
  render() {
    const {
      onChange,
      value,
    } = this.props;

    const dataTest = { "data-test": this.props["data-test"] };
    return (
        <FormControlLabel
          label={this.floatingLabelText()}
          control={<Checkbox
            {...dataTest}
            checked={value===true}
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
