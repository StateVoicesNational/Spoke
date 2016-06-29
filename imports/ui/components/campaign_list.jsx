import React, { Component, PropTypes } from 'react';
import { List, ListItem } from 'material-ui/List';
import { moment } from 'meteor/momentjs:moment'
import WarningIcon from 'material-ui/svg-icons/alert/warning'

const styles = {
  past: {
    opacity: 0.6,
  }
}
export class CampaignList extends Component {
  renderRow (campaign) {
    const { organizationId } = this.props


    const isPast = moment(campaign.dueBy).diff(moment()) < 0
    const isUnassigned = !campaign.activeAssignment()

    let listItemStyle = {}
    let leftIcon = ''
    if (isUnassigned) {
      listItemStyle = styles.past
      leftIcon  = <WarningIcon />
    } else if (isPast) {
      listItemStyle = styles.past
    }

    const secondaryText = isUnassigned ? 'Unassigned' : (
      <span>
        <span>
          {campaign.description}
          <br/>
          {moment(campaign.dueBy).format('MMM D, YYYY')}
        </span>
      </span>
    )

    return (
        <ListItem
          style={listItemStyle}
          key={campaign._id}
          primaryText={`${campaign.title}`}
          onTouchTap={() => FlowRouter.go('campaign', {organizationId, campaignId: campaign._id })}
          secondaryText={secondaryText}
          leftIcon={leftIcon}
        />
    )
  }


  render() {
    const { campaigns } = this.props
    return campaigns.length === 0 ? '' : (
        <List>
          {campaigns.map((campaign) => this.renderRow(campaign))}
        </List>
    );
  }
}

CampaignList.propTypes = {
  campaigns: PropTypes.array
}