import React, { Component } from 'react'
import type from 'prop-types'

import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import FormHelperText from '@material-ui/core/FormHelperText'
import MenuItem from '@material-ui/core/MenuItem'

export const MESSAGE_STATUSES = {
  'all': {
    name: 'All',
    children: ['needsResponse', 'needsMessage', 'convo', 'messaged']
  },
  'needsResponse': {
    name: 'Needs Texter Response',
    children: []
  },
  'needsMessage': {
    name: 'Needs First Message',
    children: []
  },
  'convo': {
    name: 'Active Conversation',
    children: []
  },
  'messaged': {
    name: 'First Message Sent',
    children: []
  },
  'closed': {
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

    this.onMessageFilterSelectChanged = this.onMessageFilterSelectChanged.bind(this)
    this.onCampaignSelectChanged = this.onCampaignSelectChanged.bind(this)
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

  onCampaignSelectChanged(event, index, value) {
    this.setState({ campaignFilter: value })
    this.props.onCampaignChanged(value)
  }

  render() {
    return (
      <Card>
        <CardHeader title='Message Filter' actAsExpander showExpandableButton />
        <CardContent expandable>
          <FormControl>
            <InputLabel htmlFor="message-status">Which messages</InputLabel>
            <Select
              multiple
              value={this.state.messageFilter}
              hintText={''}
              onChange={this.onMessageFilterSelectChanged}
              inputProps={{
                name: 'message-status',
                id: 'message-status',
              }}
            >
              {Object.keys(MESSAGE_STATUSES).map(messageStatus => {
                const displayText = MESSAGE_STATUSES[messageStatus].name
                const isChecked = this.state.messageFilter &&
                    this.state.messageFilter.indexOf(messageStatus) > -1
                return (
                  <MenuItem key={messageStatus} value={messageStatus}>
                    {displayText}
                  </MenuItem>
                )
              })}
            </Select>
            <FormHelperText>Contact message status</FormHelperText>
          </FormControl>
          &nbsp;
          <FormControl>
            <InputLabel htmlFor="campaign-status">Campaign</InputLabel>
            <Select
              value={this.state.campaignFilter}
              onChange={this.onCampaignSelectChanged}
              inputProps={{
                name: 'campaign-status',
                id: 'campaign-status',
              }}
            >
              {CAMPAIGN_TYPE_FILTERS.map(campaignTypeFilter => {
                return (
                  <MenuItem
                    key={campaignTypeFilter[0]}
                    value={campaignTypeFilter[0]}
                    primaryText={campaignTypeFilter[1]}
                  />
                )
              })}
              {this.props.campaigns.map(campaign => {
                return <MenuItem key={campaign.id} value={campaign.id} primaryText={campaign.title} />
              })}
            </Select>
            <FormHelperText>Pick a campaign</FormHelperText>
          </FormControl>
        </CardContent>
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
