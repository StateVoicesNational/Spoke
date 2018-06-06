import React, { Component } from 'react'
import type from 'prop-types'

import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import FormHelperText from '@material-ui/core/FormHelperText'
import Button from '@material-ui/core/Button'

import { getHighestRole } from '../lib/permissions'

class IncomingMessageActions extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return (
      <Card>
        <CardHeader title={' Message Actions '} actAsExpander showExpandableButton />
        <CardContent expandable>
          <FormControl>
            <InputLabel htmlFor="reassign-texter">Reassign to ...</InputLabel>
            <Select
              value={this.state.reassignTo}
              onChange={(event, index, value) => {
                this.setState({ reassignTo: value })
              }}
              inputProps={{
                name: 'reassign',
                id: 'reassign-texter',
              }}
            >
              <MenuItem />
              {this.props.people.map(person => {
                return (
                  <MenuItem key={person.id} value={person.id}>
                    {person.displayName + ' ' + getHighestRole(person.roles)}
                  </MenuItem>
                )
              })}
            </Select>
            <FormHelperText>Pick a texter</FormHelperText>
          </FormControl>

          <Button
            onClick={() => {
              if (
                this.props.onReassignRequested !== null &&
                typeof this.props.onReassignRequested === 'function'
              ) {
                this.props.onReassignRequested(this.state.reassignTo)
              }
            }}
          >
            Reassign
          </Button>
        </CardContent>
      </Card>
    )
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func
}

export default IncomingMessageActions
