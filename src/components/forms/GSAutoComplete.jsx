import React from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

import GSFormField from "./GSFormField";
import theme from "../../styles/mui-theme";

export default class GSAutoComplete extends GSFormField {
  constructor(props) {
    super(props);
  }

  render = () => {
    const {
      label,
      fullWidth,
      placeholder,
      onChange,
      getOptionLabel,
      options,
      getOptionSelected
    } = this.props;
    let { value } = this.props;
    const dataTest = { "data-test": this.props["data-test"] };
    
    // can't be undefined or react throw uncontroled component error
    if (!value) {
      value = "";
    }

    return (
      <Autocomplete
        {...dataTest}
        getOptionLabel={
          getOptionLabel ||
          (option => option.label || "")
        }
        value={value}
        options={options}
        getOptionSelected={getOptionSelected || (opt => opt.value || "")}
        renderInput={params => {
          return (
            <TextField
              {...params}
              placeholder={placeholder}
              fullWidth={fullWidth}
              label={label}
              style={{
                marginBottom: theme.spacing(2)
              }}
            />
          );
        }}
        onChange={(event, value) => {
          onChange(value);
        }}
      />
    );
  };
}
