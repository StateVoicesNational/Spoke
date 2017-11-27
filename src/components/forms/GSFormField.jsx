import PropTypes from 'prop-types'
import React from 'react'

class GSFormField extends React.Component {
  floatingLabelText() {
    return this.props.floatingLabelText === false ? null : this.props.floatingLabelText || this.props.label
  }
}

GSFormField.propTypes = {
  floatingLabelText: PropTypes.string,
  label: PropTypes.string
}


export default GSFormField
