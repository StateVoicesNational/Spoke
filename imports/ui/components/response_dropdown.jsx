import React, { Component } from 'react'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'

export class ResponseDropdown extends Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event, index, value) {
    const { onScriptChange } = this.props
    onScriptChange(value.script)
  }

  render() {
    const { responses } = this.props
    return (
      <DropDownMenu value={1} onChange={this.handleChange}>
        <MenuItem value={1} primaryText='Saved responses' disabled />
        { responses.map((response) =>
          <MenuItem value={response}
            primaryText={response.title}
          />) }
      </DropDownMenu>
    )
  }
}

ResponseDropdown.propTypes = {
  responses: React.PropTypes.array,
  onScriptChange: React.PropTypes.function
}