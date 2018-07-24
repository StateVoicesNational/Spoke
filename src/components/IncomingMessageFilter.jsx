import React, { Component } from 'react'
import type from 'prop-types'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import theme from '../styles/theme'

import SuperSelectField from 'material-ui-superselectfield'
import { StyleSheet, css } from 'aphrodite'

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
    flexBasis: '25%',
    display: 'flex'
  },
  spacer: {
    marginRight: '30px'
  }
})

export const MESSAGE_STATUSES = {
  all: {
    name: 'All',
    children: ['needsResponse', 'needsMessage', 'convo', 'messaged']
  },
  needsResponse: {
    name: 'Needs Texter Response',
    children: []
  },
  needsMessage: {
    name: 'Needs First Message',
    children: []
  },
  convo: {
    name: 'Active Conversation',
    children: []
  },
  messaged: {
    name: 'First Message Sent',
    children: []
  },
  closed: {
    name: 'Closed',
    children: []
  }
}

export const ALL_CAMPAIGNS = -1
export const ACTIVE_CAMPAIGNS = -2
export const ARCHIVED_CAMPAIGNS = -3

export const CAMPAIGN_TYPE_FILTERS = [
  [ALL_CAMPAIGNS, 'All Campaigns'],
  [ACTIVE_CAMPAIGNS, 'Active Campaigns'],
  [ARCHIVED_CAMPAIGNS, 'Archived Campaigns']
]

class IncomingMessageFilter extends Component {
  constructor(props) {
    super(props)

    this.state = {}

    this.onMessageFilterSelectChanged = this.onMessageFilterSelectChanged.bind(
      this
    )
    this.onCampaignSuperSelectChanged = this.onCampaignSuperSelectChanged.bind(
      this
    )
    this.onTexterSelectChanged = this.onTexterSelectChanged.bind(this)
  }

  onMessageFilterSelectChanged(event, index, values) {
    this.setState({ messageFilter: values })
    const messageStatuses = new Set()
    values.forEach(value => {
      const children = MESSAGE_STATUSES[value].children
      if (children.length > 0) {
        children.forEach(child => messageStatuses.add(child))
      } else {
        messageStatuses.add(value)
      }
    })

    const messageStatusesString = Array.from(messageStatuses).join(',')
    this.props.onMessageFilterChanged(messageStatusesString)
  }

  onCampaignSuperSelectChanged(selectedCampaign) {
    if (selectedCampaign === null) {
      return
    }
    this.setState({ campaignsFilter: selectedCampaign })
    this.props.onCampaignChanged(selectedCampaign.value)
  }

  onTexterSelectChanged(event, index, value) {
    this.setState({ texterFilter: value })
    if (this.props.onAssignmentsFilterChanged !== undefined &&
        typeof this.props.onAssignmentsFilterChanged === 'function') {
      this.props.onAssignmentsFilterChanged({ texterId: value })
    }
  }

  render() {
    const texters = [];
    this.props.campaigns.forEach(campaign => {
      campaign.assignments.forEach(assignment => {
        if (assignment.texter && !texters.find((texter) => texter.id === assignment.texter.id)) {
          texters.push(assignment.texter)
        }
      })
    })
    const campaignNodes = CAMPAIGN_TYPE_FILTERS.map(campaignTypeFilter => (
      <div
        key={campaignTypeFilter[0]}
        value={campaignTypeFilter[0]}
        label={campaignTypeFilter[1]}
      >
        {campaignTypeFilter[1]}
      </div>
    )).concat(
      this.props.campaigns.map(campaign => {
        const campaignId = parseInt(campaign.id, 10)
        return (
          <div key={campaignId} value={campaignId} label={campaign.title}>
            {campaign.title}
          </div>
        )
      })
    )

    return (
      <Card>
        <CardHeader title='Message Filter' actAsExpander showExpandableButton />
        <CardText expandable>
          <div className={css(styles.container)}>
            <div className={css(styles.flexColumn)}>
              <SelectField
                multiple
                value={this.state.messageFilter}
                hintText={'Which messages?'}
                floatingLabelText={'Contact message status'}
                floatingLabelFixed
                onChange={this.onMessageFilterSelectChanged}
              >
                {Object.keys(MESSAGE_STATUSES).map(messageStatus => {
                  const displayText = MESSAGE_STATUSES[messageStatus].name
                  const isChecked =
                    this.state.messageFilter &&
                    this.state.messageFilter.indexOf(messageStatus) > -1
                  return (
                    <MenuItem
                      key={messageStatus}
                      value={messageStatus}
                      primaryText={displayText}
                      insetChildren
                      checked={isChecked}
                    />
                  )
                })}
              </SelectField>
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <SuperSelectField
                name={'campaignsSuperSelectField'}
                children={campaignNodes}
                nb2show={10}
                showAutocompleteThreshold={'always'}
                floatingLabel='Campaign'
                hintText={'Type or select'}
                onChange={this.onCampaignSuperSelectChanged}
              />
            </div>
          </div>
          
          <SelectField
            value={this.state.texterFilter}
            hintText='Pick a texter'
            floatingLabelText='Texter'
            floatingLabelFixed
            onChange={this.onTexterSelectChanged}
          >
            {texters.map(texter => {
              return (
                <MenuItem
                  key={texter.id}
                  value={texter.id}
                  primaryText={texter.displayName}
                />
              )
            })}
          </SelectField>
        </CardText>
      </Card>
    )
      }
    }
    
IncomingMessageFilter.propTypes = {
  onCampaignChanged: type.func.isRequired,
  campaigns: type.array.isRequired,
  onMessageFilterChanged: type.func.isRequired
}

export default IncomingMessageFilter
