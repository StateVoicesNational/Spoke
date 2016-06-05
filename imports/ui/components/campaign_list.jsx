import React, { Component, PropTypes } from 'react';
import { List, ListItem } from 'material-ui/List';
import HappyFace from 'material-ui/svg-icons/social/sentiment-satisfied';
import { Empty } from './empty'
import { moment } from 'meteor/momentjs:moment'

const styles = {
  past: {
    opacity: 0.8,
  }
}
export class CampaignList extends Component {
  renderRow (campaign) {
    const { organizationId } = this.props

    const isPast = moment(campaign.dueBy).diff(moment()) < 0

    return (
        <ListItem
          style={isPast ? styles.past : ''}
          key={campaign._id}
          primaryText={campaign.title}
          onTouchTap={() => FlowRouter.go('campaign', {organizationId, campaignId: campaign._id })}
          secondaryText={`${campaign.description} - ${moment(campaign.dueBy).format('MMM D')}`}
        />
    )
  }


  render() {
    const { campaigns } = this.props
    const empty = (
      <Empty
        title="No campaigns yet"
        icon={<HappyFace />}
      />
    )
    return campaigns.length === 0 ? empty : (
        <List>
          {campaigns.map((campaign) => this.renderRow(campaign))}
        </List>
    );
  }
}

CampaignList.propTypes = {
  campaigns: PropTypes.array
}