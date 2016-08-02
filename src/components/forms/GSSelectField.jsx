import React from 'react';
import SelectField from 'material-ui/SelectField'
import { MenuItem } from 'material-ui/Menu'

import GSFormField from './GSFormField'

export default class GSSelectField extends GSFormField {
  createMenuItems() {
    return Object.keys(this.props.choices).map((choice) => {
      return (
        <MenuItem value={choice} key={choice} primaryText={this.props.choices[choice]} />
      )
    })
  }

  render() {
    console.log(this.props.value)
    return (
      <SelectField
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