import React, { Component } from 'react'
//import { CampaignList } from '../components/campaign_list'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { moment } from 'moment'
import Subheader from 'material-ui/Subheader'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import Empty from '../components/Empty'

const styles = {
  floatingButton: {
    margin: 0,
    top: 'auto',
    right: 20,
    bottom: 20,
    left: 'auto',
    position: 'fixed'
  }
}

export class AdminCampaigns extends Component {
  handleClickNewButton = () => {
    const { organizationId } = this.props
//    FlowRouter.go('campaign.new', { organizationId })
  }

  renderEmpty() {
    return (
      <Empty
        title="No campaigns yet"
        icon={<SpeakerNotesIcon />}
      />
    )
  }

  renderList() {
    const { campaigns, loading, organizationId } = this.props
    const groupedCampaigns = _.groupBy(campaigns, (campaign) => moment(campaign.dueBy).diff(moment()) < 0)
    return (
      <div>
        {
          [false, true].map((isPast) => (
            groupedCampaigns[isPast] ? (
              <div>
                <Subheader>{ isPast ? 'Past' : 'Current'}</Subheader>
                <CampaignList
                  campaigns={groupedCampaigns[isPast]}
                  organizationId={organizationId}
                />
              </div>
            ) : (
              ''
            )

          ))
        }
      </div>
    )

  }
  render() {
/*    const { campaigns, loading, organizationId } = this.props

    const content = (
      <div>
        { campaigns.length > 0 ? this.renderList() : this.renderEmpty() }
        <FloatingActionButton
          style={styles.floatingButton}
          onTouchTap={this.handleClickNewButton}
        >
          <ContentAdd />
        </FloatingActionButton>
      </div>
    )

    return (
      <AppPage
        navigation={<AdminNavigation
          title="Campaigns smee"
          organizationId={organizationId}
        />}
        content={content}
        loading={loading}
      />
    )*/
    return (
      <div>
        {this.renderEmpty()}
      </div>
    )
  }
}

export default AdminCampaigns
