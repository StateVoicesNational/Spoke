import React from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { dataSourceItem } from "../../components/utils";

import GSFormField from "./GSFormField";

export default class GSAutoComplete extends GSFormField {
  constructor(props) {
    super(props);
    const propsValue = props.value || {};

    const autoCompleteProps = {
      ...props
    };
    delete autoCompleteProps.choices;

    this.state = {
      options: this.createMenuItems(props.options),
      value: propsValue,
      name: propsValue.label,
      autoCompleteProps
    };
  }

  createMenuItems = choices =>
    choices.map(({ value, label }) => dataSourceItem(label, value));

  findMatchingChoices = valueToLookFor => {
    const regex = new RegExp(`.*${valueToLookFor}.*`, "i");
    return this.state.options.filter(item => regex.test(item.text));
  };

  render = () => {
    const {
      label,
      fullWidth,
      placeholder,
      name,
      value,
      onChange,
      getOptionLabel
    } = this.props;
    const dataTest = { "data-test": this.props["data-test"] };
    return (
      <Autocomplete
        {...dataTest}
        name={name}
        getOptionLabel={getOptionLabel || (option => option.label)}
        value={this.state.name}
        options={this.state.options}
        renderInput={params => {
          return (
            <TextField
              {...params}
              placeholder={placeholder}
              fullWidth={fullWidth}
              label={label}
            />
          );
        }}
        onChange={(event, value) => {
          // If you're searching but get no match, value is a string
          // representing your search term, but we only want to handle matches
          if (typeof value === "object" && value !== null) {
            const data = value.rawValue;
            this.setState({ data, name: value.text });
            onChange({
              value: data,
              label: value.text
            });
          } else {
            // if it matches one item, that's their selection
            const matches = this.findMatchingChoices(value);
            if (matches.length === 1) {
              const data = matches[0].rawValue;
              const searchText = matches[0].text;
              this.setState({ name: searchText, data });
              this.props.onChange({
                value: data,
                label: searchText
              });
            } else {
              this.setState({ data: undefined });
              this.props.onChange(undefined);
            }
          }
        }}
      />
    );
  };
}
