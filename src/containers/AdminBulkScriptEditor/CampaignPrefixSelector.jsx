/* eslint-disable react/no-unused-state */
import uniqBy from "lodash/uniqBy";
import PropTypes from "prop-types";
import React, { Component } from "react";
import CreatableSelect from "react-select/lib/Creatable";

const components = {
  DropdownIndicator: null
};

const createOption = label => ({
  value: label,
  label
});

class CampaignPrefixSelector extends Component {
  state = {
    inputValue: "",
    value: []
  };

  handleChange = (value, _actionMeta) => {
    this.props.onChange(value);
  };

  handleInputChange = inputValue => {
    this.setState({ inputValue });
  };

  handleKeyDown = event => {
    const { inputValue } = this.state;
    const { value } = this.props;
    if (!inputValue) return;
    switch (event.key) {
      case "Enter":
      case "Tab":
        // eslint-disable-next-line no-case-declarations
        let newValue = [...value, createOption(inputValue)];
        newValue = uniqBy(newValue, "value");
        this.setState({
          inputValue: ""
        });
        this.props.onChange(newValue);
        event.preventDefault();
      // no default
    }
  };

  render() {
    const { inputValue } = this.state;
    const { value, isDisabled } = this.props;
    return (
      <CreatableSelect
        components={components}
        inputValue={inputValue}
        isClearable
        isMulti
        menuIsOpen={false}
        onChange={this.handleChange}
        onInputChange={this.handleInputChange}
        onKeyDown={this.handleKeyDown}
        placeholder="Type something and press enter..."
        value={value}
        isDisabled={isDisabled}
      />
    );
  }
}

CampaignPrefixSelector.propTypes = {
  value: PropTypes.arrayOf(PropTypes.object).isRequired,
  isDisabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

export default CampaignPrefixSelector;
