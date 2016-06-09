import React, { Component } from 'react'
import { CampaignList } from '../components/campaign_list'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { AdminNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { moment } from 'meteor/momentjs:moment'
import Subheader from 'material-ui/Subheader'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import { Empty } from '../../ui/components/empty'

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

export class CampaignsPage extends Component {
  constructor(props) {
    super(props)
    this.handleClickNewButton = this.handleClickNewButton.bind(this)
  }

  handleClickNewButton() {
    const { organizationId } = this.props
    FlowRouter.go('campaign.new', { organizationId })
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
    const { campaigns, loading, organizationId } = this.props

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
    )
  }
}
