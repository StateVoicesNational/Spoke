import React from "react";
import AutoComplete from "material-ui/AutoComplete";
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
      dataSource: this.createMenuItems(props.choices),
      value: propsValue,
      name: propsValue.label,
      autoCompleteProps
    };
  }

  createMenuItems = choices =>
    choices.map(({ value, label }) => dataSourceItem(label, value));

  findMatchingChoices = valueToLookFor => {
    const regex = new RegExp(`.*${valueToLookFor}.*`, "i");
    return this.state.dataSource.filter(item => regex.test(item.text));
  };

  render = () => {
    return (
      <AutoComplete
        filter={AutoComplete.caseInsensitiveFilter}
        autoFocus
        {...this.state.autoCompleteProps}
        onUpdateInput={searchText => {
          if (searchText !== this.state.name) {
            this.props.onChange(undefined);
          }
          this.setState({ name: searchText });
        }}
        searchText={this.state.name}
        dataSource={this.state.dataSource}
        onNewRequest={value => {
          // If you're searching but get no match, value is a string
          // representing your search term, but we only want to handle matches
          if (typeof value === "object") {
            const data = value.rawValue;
            this.setState({ data, name: value.text });
            this.props.onChange({
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
