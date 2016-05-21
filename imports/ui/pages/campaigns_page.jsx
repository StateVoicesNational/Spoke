import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { CampaignList } from '../components/campaign_list'
import Subheader from 'material-ui/Subheader'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import Divider from 'material-ui/Divider'

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

  render() {
    const { campaigns } = this.props

    return <Paper>
      <CampaignList campaigns={campaigns} />
      <FloatingActionButton
        mini
        onTouchTap={this.handleClickNewButton}>
        <ContentAdd />
      </FloatingActionButton>
    </Paper>
  }
}
