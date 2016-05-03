import React, { Component, PropTypes } from 'react';
import { List, ListItem } from 'material-ui/List';

export class CampaignList extends Component {
  renderRow (campaign) {
    return (
        <ListItem
          key={campaign._id}
          primaryText={campaign.title}
          secondaryText={campaign.description}
        />
    )
  }

  render() {
    const { campaigns } = this.props
    console.log(campaigns)
    return (
        <List>
          {campaigns.map((campaign) => this.renderRow(campaign))}
        </List>
    );
  }
}

CampaignList.propTypes = {
  campaigns: PropTypes.array
}