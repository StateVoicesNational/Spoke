import React, { Component } from 'react'
import type from 'prop-types'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import { getHighestRole } from '../lib/permissions'
import FlatButton from 'material-ui/FlatButton'
import SuperSelectField from 'material-ui-superselectfield'
import { css, StyleSheet } from 'aphrodite'
import theme from '../styles/theme'

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  flexColumn: {
    flex: 0,
    flexBasis: '40%',
    display: 'flex'
  },
  spacer: {
    marginRight: '30px'
  }
})

class IncomingMessageActions extends Component {
  constructor(props) {
    super(props)

    this.onReassignmentClicked = this.onReassignmentClicked.bind(this)
    this.onReassignSuperSelectChanged = this.onReassignSuperSelectChanged.bind(
      this
    )

    this.state = {}
  }

  onReassignmentClicked() {
    this.props.onReassignRequested(this.state.reassignTo)
  }

  onReassignSuperSelectChanged(selectedTexter) {
    if (selectedTexter === null) {
      return
    }
    this.setState({ reassignTo: selectedTexter.value })
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
        <CardHeader
          title={' Message Actions '}
          actAsExpander
          showExpandableButton
        />
        <CardText expandable>
          <div className={css(styles.container)}>
            <div className={css(styles.flexColumn)}>
              <SuperSelectField
                style={{ width: '90%' }}
                name={'reassignSuperSelectField'}
                children={texterNodes}
                nb2show={10}
                showAutocompleteThreshold={'always'}
                floatingLabel={'Reassign to ...'}
                hintText={'Type or select'}
                onChange={this.onReassignSuperSelectChanged}
              />
            </div>
            <div className={css(styles.flexColumn)}>
              <FlatButton
                label={'Reassign'}
                onClick={this.onReassignmentClicked}
              />
            </div>
          </div>
        </CardText>
      </Card>
    )
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func.isRequired
}

export default IncomingMessageActions
