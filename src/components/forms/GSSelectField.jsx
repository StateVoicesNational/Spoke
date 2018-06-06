import React from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import GSFormField from './GSFormField';

export default class GSSelectField extends GSFormField {
  createMenuItems() {
    return this.props.choices.map(({ value, label }) => (
      <MenuItem
        value={value}
        key={value}
        primaryText={label}
      />
    ))
  }

  render() {
    return (
      <Select
        children={this.createMenuItems()}
        floatingLabelText={this.props.label}
        {...this.props}
        onChange={(event, index, value) => {
          this.props.onChange(value)
        }}
      />
    )
  }
}
