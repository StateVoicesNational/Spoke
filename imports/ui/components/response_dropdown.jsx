import React, { Component } from 'react'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import { ListItem, List } from 'material-ui/List'

export class ResponseDropdown extends Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)

    this.state = {
      value: 1
    }
  }

  handleChange(event, index, value) {
    console.log(value)
    const { onScriptChange } = this.props
    onScriptChange(value.script)
  }

  render() {
    const { responses } = this.props
    console.log(responses, responses[0].title)
    return (
      <DropDownMenu value={this.state.value} onChange={this.handleChange}>
        <MenuItem value={1} primaryText='Saved responses' disabled />
        { responses.map((response) =>
          <MenuItem value={response}
            primaryText={response.title}
            rightIcon={<span>{response.script}</span>}
          />) }
      </DropDownMenu>
    )
  }
}
