import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { CampaignList } from '../components/campaign_list'
import { CampaignForm } from '../components/campaign_form'
import FloatingActionButton from 'material-ui/FloatingActionButton'

import ContentAdd from 'material-ui/svg-icons/content/add'

export class CampaignsPage extends Component {
  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.state = {
      open: true
    }
  }

  handleOpenDialog() {
    console.log("open")
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
        onTouchTap={this.handleOpenDialog}>
        <ContentAdd />
      </FloatingActionButton>
      <CampaignList campaigns={campaigns} />
      aoenuthaoeushtn
      <CampaignForm open={this.state.open} onSubmit={this.handleSubmit} />
    </Paper>
  }
}
