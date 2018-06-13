import React, { Component } from 'react'
import type from 'prop-types'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

export const MESSAGE_STATUSES = {
  'all': {
    name: 'All',
    children: ['needsResponse', 'needsMessage', 'convo', 'messaged'],
  },
  'needsResponse': {
    name: 'Needs Texter Response',
    children: [],
  },
  'needsMessage': {
    name: 'Needs First Message',
    children: [],
  },
  'convo': {
    name: 'Active Conversation',
    children: [],
  },
  'messaged': {
    name: 'First Message Sent',
    children: [],
  },
};

export const ALL_CAMPAIGNS = -1;
export const ACTIVE_CAMPAIGNS = -2;
export const ARCHIVED_CAMPAIGNS = -3;

export const CAMPAIGN_TYPE_FILTERS = [
  [ALL_CAMPAIGNS, 'All Campaigns'],
  [ACTIVE_CAMPAIGNS, 'Active Campaigns'],
  [ARCHIVED_CAMPAIGNS, 'Archived Campaigns']
];

class IncomingMessageFilter extends Component {
  constructor(props) {
    super(props)

    this.state = {};

    this.onMessageFilterSelectChanged = this.onMessageFilterSelectChanged.bind(this);
    this.onCampaignSelectChanged = this.onCampaignSelectChanged.bind(this);
  }

  onMessageFilterSelectChanged(event, index, values) {
    this.setState({ messageFilter: values })
    const messageStatuses = new Set();
    values.forEach(value => {
      const children = MESSAGE_STATUSES[value].children;
      if (children.length > 0) {
        children.forEach(child => messageStatuses.add(child));
      } else {
        messageStatuses.add(value);
      }
    });

    const messageStatusesString = Array.from(messageStatuses).join(',');
    if (this.props.onMessageFilterChanged !== undefined &&
        typeof this.props.onMessageFilterChanged === 'function') {
      this.props.onMessageFilterChanged(messageStatusesString)
    }
  }

  onCampaignSelectChanged(event, index, value) {
    this.setState({ campaignFilter: value });

    if (this.props.onCampaignChanged !== undefined &&
        typeof this.props.onCampaignChanged === 'function') {
      this.props.onCampaignChanged(value);
    }
  }

  render() {
    return (
      <Card>
        <CardHeader title='Message Filter' actAsExpander={true} showExpandableButton={true} />
        <CardText expandable>
          <SelectField
            multiple={true}
            value={this.state.messageFilter}
            hintText={'Which messages'}
            floatingLabelText={'Contact message status'}
            floatingLabelFixed={true}
            onChange={this.onMessageFilterSelectChanged}
          >
            {Object.keys(MESSAGE_STATUSES).map(messageStatus => {
              const displayText = MESSAGE_STATUSES[messageStatus].name;
              const isChecked = this.state.messageFilter &&
                  this.state.messageFilter.indexOf(messageStatus) > -1
              return (
                <MenuItem
                  key={messageStatus}
                  value={messageStatus}
                  primaryText={displayText}
                  insetChildren={true}
                  checked={isChecked}
                />
              );
            })}
          </SelectField>
          &nbsp;
          <SelectField
            value={this.state.campaignFilter}
            hintText='Pick a campaign'
            floatingLabelText='Campaign'
            floatingLabelFixed={true}
            onChange={this.onCampaignSelectChanged}
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
          </SelectField>
        </CardText>
      </Card>
    );
  }
}

IncomingMessageFilter.propTypes = {
  onCampaignChanged: type.func,
  campaigns: type.array,
  onMessageFilterChanged: type.func
}

export default IncomingMessageFilter
