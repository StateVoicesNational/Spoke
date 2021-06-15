import React from "react";

import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import theme from "../../styles/mui-theme";

import GSFormField from "./GSFormField";

export default class GSSelectField extends GSFormField {
  createMenuItems() {
    return this.props.choices.map(({ value, label }) => (
      <MenuItem value={value} key={value}>
        {label}
      </MenuItem>
    ));
  }

  render() {
    const { name, value, label, onChange, style } = this.props;
    const dataTest = { "data-test": this.props["data-test"] };
    return (
      <FormControl style={style}>
        <InputLabel>{label}</InputLabel>
        <Select
          fullWidth
          {...dataTest}
          name={name}
          value={value}
          onChange={event => {
            onChange(event.target.value);
          }}
          style={{
            marginBottom: theme.spacing(2)
          }}
        >
          {this.createMenuItems()}
        </Select>
      </FormControl>
    );
  }
}
