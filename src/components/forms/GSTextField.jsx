import React from 'react';
import TextField from '@material-ui/core/TextField';

import GSFormField from './GSFormField';

export default class GSTextField extends GSFormField {
  render() {
    let value = this.props.value
    return (
      <TextField
        floatingLabelText={this.floatingLabelText()}
        floatingLabelStyle={{
          zIndex: 0
        }}
        onFocus={(event) => event.target.select()}
        {...this.props}
        value={value}
        onChange={(event) => {
          this.props.onChange(event.target.value)
        }}
        type='text'
      />
    );
  }
}
