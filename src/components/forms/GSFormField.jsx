import React from 'react'

export default class GSFormField extends React.Component {
  floatingLabelText() {
    return this.props.floatingLabelText === false ? null : this.props.floatingLabelText || this.props.label
  }
}
