import React, { Component } from 'react'
import type from "prop-types";

import AutoComplete from "material-ui/AutoComplete";
import { Card, CardHeader, CardText } from "material-ui/Card";
import { getHighestRole } from "../lib/permissions";
import FlatButton from "material-ui/FlatButton";
import { css, StyleSheet } from "aphrodite";
import theme from "../styles/theme";
import { dataSourceItem } from './utils'

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  flexColumn: {
    flex: 0,
    flexBasis: '30%',
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
    this.onReassignAllMatchingClicked = this.onReassignAllMatchingClicked.bind(
      this
    )
    this.onReassignChanged = this.onReassignChanged.bind(
      this
    )

    this.state = {}
  }

  onReassignmentClicked() {
    this.props.onReassignRequested(this.state.reassignTo)
  }

  onReassignAllMatchingClicked() {
    this.props.onReassignAllMatchingRequested()
  }

  onReassignChanged(selection, index) {
    let texterUserId = undefined
    if (index === -1) {
      const texter = this.props.texters.find(texter => {
        this.setState({ reassignTo: undefined })
        return texter.displayName === selection
      })
      if (texter) {
        texterUserId = texter.id
      }
    } else {
      texterUserId = selection.value.key
    }
    if (texterUserId) {
      this.setState({ reassignTo: parseInt(texterUserId, 10) });
    } else {
      this.setState({ reassignTo: undefined })

    }
  }

  render() {
    const texterNodes = !this.props.people
      ? []
      : this.props.people.map(user => {
          const userId = parseInt(user.id, 10)
          const label = user.displayName + ' ' + getHighestRole(user.roles)
          return dataSourceItem(label, userId)
        })
      texterNodes.sort((left, right) => {
          return left.text.localeCompare(right.text, "en", {sensitivity: "base"})
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
              <AutoComplete
                filter={AutoComplete.caseInsensitiveFilter}
                maxSearchResults={8}
                onFocus={() => this.setState({
                  reassignTo: undefined,
                  texterSearchText : '' })}
                onUpdateInput={texterSearchText=>
                  this.setState({ texterSearchText })
                }
                searchText={this.state.texterSearchText}
                dataSource={texterNodes}
                hintText={'Search for a texter'}
                floatingLabelText={'Reassign to ...'}
                onNewRequest={this.onReassignChanged}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <FlatButton
                label={'Reassign'}
                onClick={this.onReassignmentClicked}
                disabled={!this.state.reassignTo}
              />
            </div>
            {this.props.conversationCount ? (
              <div className={css(styles.flexColumn)}>
                <FlatButton
                  label={`Reassign all ${this.props.conversationCount} matching`}
                  onClick={this.onReassignAllMatchingClicked}
                  disabled={!this.state.reassignTo}
                />
              </div>) : ''
            }
          </div>
        </CardText>
      </Card>
    )
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  conversationCount: type.number
}

export default IncomingMessageActions
