import React, { Component } from 'react'
import type from 'prop-types'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import AutoComplete from 'material-ui/AutoComplete'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import theme from '../styles/theme'
import { dataSourceItem } from './utils'

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
    flex: '0 1 25%'
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

export const ALL_TEXTERS = -1

export const TEXTER_FILTERS = [[ALL_TEXTERS, 'All Texters']]

class IncomingMessageFilter extends Component {
  constructor(props) {
    super(props)

    this.state = {}

    this.onMessageFilterSelectChanged = this.onMessageFilterSelectChanged.bind(
      this
    )
    this.onTexterSelected = this.onTexterSelected.bind(this)
    this.onCampaignSelected = this.onCampaignSelected.bind(this)
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

  onCampaignSelected(selection, index) {
    let campaignId = undefined
    if (index === -1) {
      const campaign = this.props.texters.find(campaign => {
        return campaign.title === selection
      })
      if (campaign) {
        campaignId = campaign.id
      }
    } else {
      campaignId = selection.value.key
    }
    if (campaignId) {
      this.props.onCampaignChanged(parseInt(campaignId, 10))
    }
  }

  onTexterSelected(selection, index) {
    let texterUserId = undefined
    if (index === -1) {
      const texter = this.props.texters.find(texter => {
        return texter.displayName === selection
      })
      if (texter) {
        texterUserId = texter.id
      }
    } else {
      texterUserId = selection.value.key
    }
    if (texterUserId) {
      this.props.onTexterChanged(parseInt(texterUserId, 10))
    }
  }

  render() {
    const texterNodes = TEXTER_FILTERS.map(texterFilter =>
      dataSourceItem(texterFilter[1], texterFilter[0])
    ).concat(
      !this.props.texters
        ? []
        : this.props.texters.map(user => {
            const userId = parseInt(user.id, 10)
            return dataSourceItem(user.displayName, userId)
          })
    )

    const campaignNodes = CAMPAIGN_TYPE_FILTERS.map(campaignTypeFilter =>
      dataSourceItem(campaignTypeFilter[1], campaignTypeFilter[0])
    ).concat(
      !this.props.campaigns
        ? []
        : this.props.campaigns.map(campaign => {
            const campaignId = parseInt(campaign.id, 10)
            const campaignDisplay = `${campaignId}: ${campaign.title}`
            return dataSourceItem(campaignDisplay, campaignId)
          })
    )

    return (
      <Card>
        <CardHeader title="Message Filter" actAsExpander showExpandableButton />
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
              <AutoComplete
                maxSearchResults={5}
                onFocus={() => this.setState({ campaignSearchText: '' })}
                onUpdateInput={campaignSearchText =>
                  this.setState({ campaignSearchText })
                }
                searchText={this.state.campaignSearchText}
                dataSource={campaignNodes}
                hintText={'Search for a campaign'}
                floatingLabelText={'Campaign'}
                onNewRequest={this.onCampaignSelected}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <AutoComplete
                maxSearchResults={5}
                onFocus={() => this.setState({ texterSearchText: '' })}
                onUpdateInput={texterSearchText =>
                  this.setState({ texterSearchText })
                }
                searchText={this.state.texterSearchText}
                dataSource={texterNodes}
                hintText={'Search for a texter'}
                floatingLabelText={'Texter'}
                onNewRequest={this.onTexterSelected}
              />
            </div>
          </div>
        </CardText>
      </Card>
    )
  }
}

IncomingMessageFilter.propTypes = {
  onCampaignChanged: type.func.isRequired,
  onTexterChanged: type.func.isRequired,
  campaigns: type.array.isRequired,
  texters: type.array.isRequired,
  onMessageFilterChanged: type.func.isRequired,
  assignmentsFilter: type.shape({
    texterId: type.number
  }).isRequired
}

export default IncomingMessageFilter
