import React, { Component } from 'react'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import {ListItem} from 'material-ui/List'
const styles = {
  textarea: {
    padding: 20
  }
}

export class ResponseDropdown extends Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)

    this.state = {
      value: 1
    }
  }

  handleChange(event, index, value) {
    this.setState({value})
  }

  render() {
    return (
      <DropDownMenu value={this.state.value} onChange={this.handleChange}>
        <MenuItem value={1} primaryText="Other responses" disabled>
        </MenuItem>
        <ListItem value={2} primaryText="SMEE flee">
        </ListItem>
        <MenuItem value={3} primaryText="How long do I have to stay?" />
        <MenuItem value={4} primaryText="Not this event but another?" />
        <MenuItem value={5} primaryText="How did you get my number?" />
      </DropDownMenu>
    )
  }
}
