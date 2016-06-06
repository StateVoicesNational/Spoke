import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import FlatButton from 'material-ui/FlatButton'
import Popover from 'material-ui/Popover'
import Menu from 'material-ui/Menu'
import MenuItem from 'material-ui/MenuItem'
import { Fake } from 'meteor/anti:fake'
import { LoginForm } from './login_form'
import { FlowRouter } from 'meteor/kadira:flow-router'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'
import IconButton from 'material-ui/IconButton'
import Avatar from 'material-ui/Avatar'
import { displayName } from '../../api/users/users'
import {List, ListItem} from 'material-ui/List';

const avatarSize = 28

const styles = {
  toolbar: {
    backgroundColor: 'white'
  }
}
export class UserMenu extends Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false
    }
    this.handleRequestClose = this.handleRequestClose.bind(this)
    this.handleTouchTap = this.handleTouchTap.bind(this)
    this.handleMenuChange = this.handleMenuChange.bind(this)
  }

  login() {
    const data = {
      email: Fake.user().email,
      password: 'test'
    }

    Accounts.createUser(data, (error) => {
      Meteor.loginWithPassword(email, password, (loginError) => {
        console.log("loginError", loginError)
      })
      console.log("create User error?", error)
    });
    console.log("should have logged in!")
  }

  handleTouchTap(event) {
    // This prevents ghost click.
    event.preventDefault();

    this.setState({
      open: true,
      anchorEl: event.currentTarget,
    });
  }

  handleRequestClose (){
    this.setState({
      open: false
    });
  };

  handleMenuChange(event, value) {
    console.log("value", value)
    if (value === 'logout') {
      Meteor.logout(() => FlowRouter.go('/'))
    }
    else {
      FlowRouter.go(`/${value}/campaigns`)
    }
    this.handleRequestClose()
  }

  renderAvatar(user, size) {
    return <Avatar size={size}>{displayName(user).charAt(0)}</Avatar>
  }
  render() {
    const { organizations, user } = this.props
    if (!user) {
      return null
    }
    return (
      <div>
        <IconButton
          onTouchTap={this.handleTouchTap}
        >
          {this.renderAvatar(user, avatarSize)}
        </IconButton>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.handleRequestClose}
        >
          <ListItem
            disabled
            primaryText={displayName(user)}
            secondaryText={user.emails[0].address}
            leftAvatar={this.renderAvatar(user, 40)}
          />
          <Divider />


          <Menu onChange={this.handleMenuChange}>
            <Subheader>Teams</Subheader>
            { organizations.map((organization) => (
              <MenuItem
                key={organization._id}
                primaryText={organization.name}
                value={organization._id}
              />
            ))}
            <Divider />
            <MenuItem
              primaryText="Log out"
              value="logout"
            />
          </Menu>
        </Popover>
      </div>
    )
  }
}
