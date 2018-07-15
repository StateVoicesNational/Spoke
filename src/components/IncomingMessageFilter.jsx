import React, { Component } from 'react'
import type from 'prop-types'
import loadData from '../containers/hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import AutoComplete from 'material-ui/AutoComplete'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

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

  onCampaignsSearchPatternChanged(searchText, dataSource, params) {
    this.props.onCampaignsSearchPatternChanged(searchText)
  }

  render() {
    return (
      <Card>
        <CardHeader title='Message Filter' actAsExpander showExpandableButton/>
        <CardText expandable>
          <SelectField
            multiple
            value={this.state.messageFilter}
            hintText={'Which messages'}
            floatingLabelText={'Contact message status'}
            floatingLabelFixed
            onChange={this.onMessageFilterSelectChanged}
          >
            {Object.keys(MESSAGE_STATUSES).map(messageStatus => {
              const displayText = MESSAGE_STATUSES[messageStatus].name
              const isChecked = this.state.messageFilter &&
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
          &nbsp;
          <SelectField
            value={this.state.campaignFilter}
            hintText='Pick a campaign'
            floatingLabelText='Campaign'
            floatingLabelFixed
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
          </SelectField>
          <AutoComplete
            dataSource={this.props.autocompleteOrganization.loading ? [] : this.props.autocompleteOrganization.organization.campaigns.map(campaign => {
              return {
                text: campaign.title,
                value: (
                  <MenuItem key={campaign.id} value={campaign.id} primaryText={campaign.title}/>
                )
              }
            })}
          />
        </CardText>
      </Card>
    )
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  /*
  autocompleteOrganization: {
    query: gql`
      query Q($organizationId: String!, $campaignsFilter: CampaignsFilter) {
        organization(id: $organizationId) {
          id
          campaigns(campaignsFilter: $campaignsFilter) {
            id
            title
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      campaignsFilter: {}
    },
    forceFetch: true
  }
  */
})

IncomingMessageFilter.propTypes = {
  organizationId: type.string.isRequired,
  onCampaignChanged: type.func.isRequired,
  campaigns: type.array.isRequired,
  onMessageFilterChanged: type.func.isRequired,
  onCampaignsSearchPatternChanged: type.func.isRequired,
  campaignsSearchPattern: type.string.isRequired

}

//export default IncomingMessageFilter
export default loadData(withRouter(IncomingMessageFilter), { mapQueriesToProps })
