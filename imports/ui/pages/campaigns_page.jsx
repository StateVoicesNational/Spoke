import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { CampaignList } from '../components/campaign_list'
import { CampaignForm } from '../components/campaign_form'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { FlowRouter } from 'meteor/kadira:flow-router'

import ContentAdd from 'material-ui/svg-icons/content/add'

export class CampaignsPage extends Component {
  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.createNewCampaign = this.createNewCampaign.bind(this)
    this.state = {
      open: true
    }
  }

  createNewCampaign() {
    FlowRouter.go('/campaigns/new')
  }

  handleOpenDialog() {
    this.setState({ open: true })
  }
  handleCloseDialog() {
    this.setState({ open: false })
  }

  handleSubmit() {
    this.handleCloseDialog()
  }

  render() {
    const { campaigns } = this.props
    return <Paper>
      <FloatingActionButton mini
        onTouchTap={this.createNewCampaign}>
        <ContentAdd />
      </FloatingActionButton>
      <CampaignList campaigns={campaigns} />
    </Paper>
  }
}
