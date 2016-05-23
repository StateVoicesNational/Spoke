import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import Subheader from 'material-ui/Subheader'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import { capitalize } from 'lodash'
import ArrowBackIcon from 'material-ui/svg-icons/navigation/arrow-back';
import { UserMenu } from './user_menu'
import { organizationsForUser } from '../../api/users/users'
const sectionUrl = (organizationId, section) => `/${organizationId}/${section}`


export class Navigation extends Component {
  constructor(props) {
    super(props)

    this.handleCloseDrawer = this.handleCloseDrawer.bind(this)
    this.handleOpenDrawer = this.handleOpenDrawer.bind(this)

    this.state = {
      open: false
    }
  }

  handleOpenDrawer() {
    this.setState({ open: true })
  }
  handleCloseDrawer() {
    this.setState({ open: false })
  }

  render() {
    const { organizationId, title, sections, user, organizations} = this.props
    const { open } = this.state

    // const iconElementRight = (
    //   <FlatButton
    //     style={styles.avatarButton}
    //     children={[<Avatar size={avatarSize}>A</Avatar>]}
    //   />
    // )

    return (
      <div>
        <AppBar
          onLeftIconButtonTouchTap={ this.handleOpenDrawer }
          title={title}
          iconElementRight={<UserMenu user={Meteor.user()} organizations={organizationsForUser(Meteor.user())} />}
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
                onTouchTap={() => FlowRouter.go(sectionUrl(organizationId, section))}
              />
            ))}
          </List>
        </Drawer>
      </div>
    )
  }
}

export const BackNavigation = ({ organizationId, title, backToSection}) => (
  <AppBar
    iconElementLeft={
      <IconButton onTouchTap={ () => FlowRouter.go(sectionUrl(organizationId, backToSection)) }>
        <ArrowBackIcon />
      </IconButton>}
    title={title}
  />
)
export const AdminNavigation = ({ organizationId, title }) => (
  <Navigation
    title={title}
    organizationId={organizationId}
    sections={['campaigns', 'texters']}
  />
)

export const AppNavigation = ({ organizationId, title }) => (
  <Navigation
    organizationId={organizationId}
    title={title}
    sections={['messages', 'assignments']}
  />
)
