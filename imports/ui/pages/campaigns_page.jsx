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
    this.handleCloseDrawer = this.handleCloseDrawer.bind(this)
    this.handleOpenDrawer = this.handleOpenDrawer.bind(this)
    this.handleClickNewButton = this.handleClickNewButton.bind(this)
    this.state = {
      navDrawerOpen: false
    }
  }

  handleClickNewButton() {
    const { organizationId } = this.props
    FlowRouter.go(`/${organizationId}/campaigns/new`)
  }

  handleClickCampaigns() {
    FlowRouter.go('/campaigns')
  }

  handleClickAssignments() {
    FlowRouter.go('/assignments')
  }

  handleOpenDrawer() {
    console.log("handle open drawer!?!?")
    this.setState({ navDrawerOpen: true })
  }
  handleCloseDrawer() {
    this.setState({ navDrawerOpen: false })
  }

  render() {
    console.log("campaign props", this.props)
    const { campaigns } = this.props
    const { navDrawerOpen } = this.state

    return <Paper>
      <AppBar
        onLeftIconButtonTouchTap={ this.handleOpenDrawer }
        title="Campaigns"
      />
      <Drawer open={this.state.navDrawerOpen}
        docked={false}
        onRequestChange={(navDrawerOpen) => this.setState({ navDrawerOpen })}
      >
        <List>
          <Subheader>Setup</Subheader>
          <ListItem
            key={1}
            primaryText="Campaigns"
            onTouchTap={this.handleClickCampaigns.bind(this)}
          />
          <ListItem
            key={2}
            primaryText="Texters"
          />
          <Divider />
          <Subheader>Texting</Subheader>
          <ListItem
            key={3}
            primaryText="Assignments"
            onTouchTap={this.handleClickAssignments.bind(this)}
          />
          <ListItem
            key={4}
            primaryText="Messages"
          />
        </List>
      </Drawer>


      <FloatingActionButton
        mini
        onTouchTap={this.handleClickNewButton}>
        <ContentAdd />
      </FloatingActionButton>
      <CampaignList campaigns={campaigns} />
    </Paper>
  }
}
