import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { CampaignList } from '../components/campaign_list'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { AdminNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'

import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'

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

  render() {
    const { campaigns, loading, organizationId } = this.props

    console.log("campaigns", campaigns)
    const content = (
      <div>
        <CampaignList
          campaigns={campaigns}
          organizationId={organizationId}
        />
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
          title="Campaigns"
          organizationId={organizationId}
        />}
        content={content}
        loading={loading}
      />
    )
  }
}
