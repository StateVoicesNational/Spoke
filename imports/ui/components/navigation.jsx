import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import Subheader from 'material-ui/Subheader'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import { capitalize } from 'lodash'

export class Navigation extends Component {
  constructor(props) {
    super(props)

    this.handleCloseDrawer = this.handleCloseDrawer.bind(this)
    this.handleOpenDrawer = this.handleOpenDrawer.bind(this)

    this.state = {
      open: true
    }
  }

  handleClick(event) {
    console.log(event.target)
    console.log(event.target.key)
    FlowRouter.go(`/${organizationId}/texters`)
  }

  handleClickCampaigns(value) {
    console.log("value", value)
    const { organizationId } = this.props
    FlowRouter.go(`/${organizationId}/campaigns`)
  }

  handleOpenDrawer() {
    console.log("handle open drawer!?!?")
    this.setState({ open: true })
  }
  handleCloseDrawer() {
    this.setState({ open: false })
  }

  render() {
    const { campaigns, organizationId, sections } = this.props
    const { open } = this.state

    return (
      <div>
        <AppBar
          onLeftIconButtonTouchTap={ this.handleOpenDrawer }
          title="Campaigns"
        />
        <Drawer open={open}
          docked={false}
          onRequestChange={(open) => this.setState({ open })}
        >
          <List>
            <Subheader>Setup</Subheader>

            { sections.map((section) => (
              <ListItem
                key={section}
                primaryText={capitalize(section)}
                onTouchTap={() => FlowRouter.go(`/${organizationId}/${section}`)}
              />
            ))}

          </List>
        </Drawer>
      </div>
    )
  }
}

export const AdminNavigation = ({ organizationId }) => (
  <Navigation
    organizationId={organizationId}
    sections={['campaigns', 'texters']}
  />
)

export const AppNavigation = ({ organizationId }) => (
  <Navigation
    organizationId={organizationId}
    sections={['messages', 'assignments']}
  />
)
