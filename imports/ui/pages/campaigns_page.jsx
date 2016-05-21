import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { CampaignList } from '../components/campaign_list'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { AdminNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'

import ContentAdd from 'material-ui/svg-icons/content/add'

export class CampaignsPage extends Component {
  constructor(props) {
    super(props)
    this.handleClickNewButton = this.handleClickNewButton.bind(this)
  }

  handleClickNewButton() {
    const { organizationId } = this.props
    FlowRouter.go(`/${organizationId}/campaigns/new`)
  }

  navigation() {

  }
  render() {
    const { campaigns, loading, organizationId } = this.props
    const content = (
      <Paper>
        <CampaignList campaigns={campaigns} />
        <FloatingActionButton
          mini
          onTouchTap={this.handleClickNewButton}>
          <ContentAdd />
        </FloatingActionButton>
      </Paper>
    )
    return (
      <AppPage
        navigation={<AdminNavigation
          title='Campaigns'
          organizationId={organizationId}
        />}
        content={content}
        loading={loading}
      />
    )
  }
}
