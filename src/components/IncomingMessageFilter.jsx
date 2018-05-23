import React, {Component} from 'react'
import type from 'prop-types'

import {Card, CardHeader, CardText} from 'material-ui/Card'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

class IncomingMessageFilter extends Component {
  ALL_MESSAGES = 'All Messages'
  ALL_INCOMING_MESSAGES = 'All Incoming Messages'
  UNRESPONDED_INCOMING_MESSAGES = 'Unresponded'

  ALL_CAMPAIGNS = 'All Active Campaigns'

  constructor(props) {
    super(props)

    this.state = {
      messageDirectionFilter: this.ALL_MESSAGES,
      campaignFilter: this.ALL_CAMPAIGNS

    }
  }


  render() {
    return (
      <Card>
        <CardHeader title={'All Incoming Messages'} actAsExpander={true} showExpandableButton={true}/>
        <CardText expandable={true}>

          <SelectField
            value={this.state.messageDirectionFilter}
            onChange={(event, index, value) => {
              this.setState({messageDirectionFilter: value})
            }
            }
          >
            <MenuItem value={this.ALL_MESSAGES} primaryText={this.ALL_MESSAGES}/>
            <MenuItem value={this.ALL_INCOMING_MESSAGES} primaryText={this.INCOMING_MESSAGES}/>
          </SelectField>

          <SelectField
            value={this.state.campaignFilter}
            onChange={(event, index, value) => {
              this.setState({campaignFilter: value})
              this.props.onCampaignChanged(value)
              this.props.onCampaignChanged(value)
            }
          >
            <MenuItem key={this.ALL_CAMPAIGNS} value={this.ALL_CAMPAIGNS} primaryText={this.ALL_CAMPAIGNS}/>

            {this.props.campaigns.map(campaign => {
              return (<MenuItem key={campaign.id} value={campaign.id} primaryText={campaign.title}/>)
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
  messages_filter:  type.object
}

export default IncomingMessageFilter
