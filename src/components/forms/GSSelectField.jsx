import React from "react";
import SelectField from "material-ui/SelectField";
import { MenuItem } from "material-ui/Menu";

import GSFormField from "./GSFormField";

export default class GSSelectField extends GSFormField {
  createMenuItems(choices) {
    return choices.map(({ value, label }) => (
      <MenuItem value={value} key={value} primaryText={label} />
    ));
  }

  render() {
    const {
      choices,
      errors,
      invalid,
      ...extraProps
    } = this.props;

    return (
      <SelectField
        children={this.createMenuItems(choices)}
        floatingLabelText={this.props.label}
        {...extraProps}
        onChange={(event, index, value) => {
          this.props.onChange(value);
        }}
      />
    );
  }
}
