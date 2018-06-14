import React, { Component } from 'react'
import type from 'prop-types'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import { getHighestRole } from '../lib/permissions'
import FlatButton from 'material-ui/FlatButton'

class IncomingMessageActions extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return (
      <Card>
        <CardHeader title={' Message Actions '} actAsExpander showExpandableButton />
        <CardText expandable>
          <SelectField
            value={this.state.reassignTo}
            hintText={'Pick a texter'}
            floatingLabelText={'Reassign to ...'}
            floatingLabelFixed
            onChange={(event, index, value) => {
              this.setState({ reassignTo: value })
            }}
          >
            <MenuItem />
            {this.props.people.map(person => {
              return (
                <MenuItem
                  key={person.id}
                  value={person.id}
                  primaryText={person.displayName + ' ' + getHighestRole(person.roles)}
                />
              )
            })}
          </SelectField>

          <FlatButton
            label='Reassign'
            onClick={() => {
              if (
                this.props.onReassignRequested !== null &&
                typeof this.props.onReassignRequested === 'function'
              ) {
                this.props.onReassignRequested(this.state.reassignTo)
              }
            }}
          />
        </CardText>
      </Card>
    )
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func
}

export default IncomingMessageActions
