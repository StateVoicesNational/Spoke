import React, { Component } from 'react'
import type from 'prop-types'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

class IncomingMessageFilter extends Component {
  messageStatuses = [
    ['All', 'all'],
    ['Needs Response', 'needsResponse'],
    ['Needs Message', 'needsMessage'],
    ['Conversation', 'convo'],
    ['Message Sent', 'messaged']
  ]

  messageStatusExpansions = {
    all: ['needsResponse', 'needsMessage', 'convo', 'messaged']
  }

  ALL_CAMPAIGNS = 'All Active Campaigns'

  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return (
      <Card>
        <CardHeader title={'Message Filter'} actAsExpander showExpandableButton />
        <CardText expandable>
          <SelectField
            multiple
            value={this.state.messageFilter}
            hintText={'Which messages'}
            floatingLabelText={'Contact message status'}
            floatingLabelFixed
            onChange={(event, index, values) => {
              this.setState({ messageFilter: values })
              const messageStatuses = new Set(
                values.map(value => {
                  if (value in this.messageStatusExpansions) {
                    return this.messageStatusExpansions[value]
                  }
                  return value
                })
              )
              const messageStatusesString = Array.from(messageStatuses).join(',')
              if (
                this.props.onMessageFilterChanged !== null &&
                typeof this.props.onMessageFilterChanged === 'function'
              ) {
                this.props.onMessageFilterChanged(messageStatusesString)
              }
            }}
          >
            {this.messageStatuses.map(messageStatus => {
              return (
                <MenuItem
                  key={messageStatus[1]}
                  value={messageStatus[1]}
                  primaryText={messageStatus[0]}
                  insetChildren
                  checked={
                    this.state.messageFilter &&
                    this.state.messageFilter.indexOf(messageStatus[1]) > -1
                  }
                />
              )
            })}
          </SelectField>

          <SelectField
            value={this.state.campaignFilter}
            hintText={'Pick a campaign'}
            floatingLabelText={'Campaign'}
            floatingLabelFixed
            onChange={(event, index, value) => {
              this.setState({ campaignFilter: value })
              if (
                this.props.onCampaignChanged !== null &&
                typeof this.props.onCampaignChanged === 'function'
              ) {
                this.props.onCampaignChanged(value)
              }
            }}
          >
            <MenuItem
              key={this.ALL_CAMPAIGNS}
              value={this.ALL_CAMPAIGNS}
              primaryText={this.ALL_CAMPAIGNS}
            />

            {this.props.campaigns.map(campaign => {
              return <MenuItem key={campaign.id} value={campaign.id} primaryText={campaign.title} />
            })}
          </SelectField>
        </CardText>
      </Card>
    )
  }
}

IncomingMessageFilter.propTypes = {
  onCampaignChanged: type.func,
  campaigns: type.array,
  onMessageFilterChanged: type.func
}

export default IncomingMessageFilter
