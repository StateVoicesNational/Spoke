import React, { Component } from 'react'
import type from 'prop-types'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import { getHighestRole } from '../lib/permissions'
import FlatButton from 'material-ui/FlatButton'
import SuperSelectField from 'material-ui-superselectfield'

class IncomingMessageActions extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    const texterNodes = !this.props.people
      ? []
      : this.props.people.map(user => {
          const userId = parseInt(user.id, 10)
          const label = user.displayName + ' ' + getHighestRole(user.roles)
          return (
            <div key={userId} value={userId} label={label}>
              {label}
            </div>
          )
        })

    return (
      <Card>
        <CardHeader title={' Message Actions '} actAsExpander showExpandableButton />
        <CardText expandable>
          <SuperSelectField
            name={'reassignSuperSelectField'}
            children={texterNodes}
            nb2show={10}
            showAutocompleteThreshold={'always'}
            floatingLabel={'Reassign to ...'}
            hintText={'Type or select'}
            onChange={selectedTexter => {
              this.setState({ reassignTo: selectedTexter.value })
            }}
          />
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
            label="Reassign"
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
