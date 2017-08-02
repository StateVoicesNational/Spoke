import React from 'react'

class GSFormField extends React.Component {
  floatingLabelText() {
    return this.props.floatingLabelText === false ? null : this.props.floatingLabelText || this.props.label
  }
}

GSFormField.propTypes = {
  floatingLabelText: React.PropTypes.string,
  label: React.PropTypes.string
}


export default GSFormField
