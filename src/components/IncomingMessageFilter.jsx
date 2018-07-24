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
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  flexColumn: {
    flex: 1,
    //textAlign: 'right',
    display: 'flex'
  },
  spacer: {
    marginRight: 20
  },
})

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
    this.onCampaignInputUpdated = this.onCampaignInputUpdated.bind(this)
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

  onCampaignSelectChanged(selectedCampaignOrString, index) {
    let selectedCampaign = undefined
    if (index < 0 && typeof (selectedCampaignOrString) === 'string') {
      selectedCampaign = this.props.campaigns.find(campaign => {
        return campaign.title === selectedCampaignOrString ? campaign : undefined
      })
    } else {
      selectedCampaign = selectedCampaignOrString
    }

    if (!selectedCampaign) {
      return
    }

    this.setState({ campaignwFilter: selectedCampaign })
    this.props.onCampaignChanged(selectedCampaign.id)
  }

  onCampaignInputUpdated(searchText, dataSource, _) {
    this.setState({campaignInput: searchText})
  }

  getCampaignsWithCampaignTypeFiltersPrepended() {
    return CAMPAIGN_TYPE_FILTERS.map(campaignTypeFilter => {
      return (
        {
          title: campaignTypeFilter[1],
          id: campaignTypeFilter[0]
        }
      )
    }).concat(this.props.campaigns)
  }

  render() {
    const campaignNodes = this.props.campaigns.map((campaign) => {
      return (
        <div
          key={campaign.id}
          value={campaign.id}
          label={campaign.title}
        >
        {campaign.title}
        </div>
      )
    })

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
            </div>
            <div className={css(styles.flexColumn)}>
              <SuperSelectField
                children={campaignNodes}
                nb2show={10}
                showAutocompleteThreshold={'always'}
                floatingLabel='Campaign'
                hintText={'Type or select'}
              />
            </div>

            {/*
          <AutoComplete
            dataSource={this.getCampaignsWithCampaignTypeFiltersPrepended()}
            dataSourceConfig={{ text: 'title', value: 'id' }}
            hintText={'Which campaign?'}
            filter={AutoComplete.caseInsensitiveFilter}
            maxSearchResults={10}
            openOnFocus={this.props.campaigns.length < 100 ? true : false}
            floatingLabelText='Campaign'
            floatingLabelFixed
            onNewRequest={this.onCampaignSelectChanged}
            onUpdateInput={this.onCampaignInputUpdated}
          />
          */}


            {/*
          <SelectField
            value={this.state.campaignsFilter}
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
            {this.props.campaigns.map(campaign => {
              return <MenuItem key={campaign.id} value={campaign.id} primaryText={campaign.title} />
            })}
          </SelectField>
          */}
          </div>
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
