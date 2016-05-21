import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import FlatButton from 'material-ui/FlatButton'
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import { Fake } from 'meteor/anti:fake'
import { LoginForm } from './login_form'
import { FlowRouter } from 'meteor/kadira:flow-router'

const styles = {
  toolbar: {
    backgroundColor: 'white'
  }
}
export class Login extends Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false
    }
    this.handleRequestClose = this.handleRequestClose.bind(this)
    this.handleTouchTap = this.handleTouchTap.bind(this)
  }

  login() {
    const data = {
      email: Fake.user().email,
      password: 'test'
    }

    Accounts.createUser(data, (error) => {
      Meteor.loginWithPassword(email, password, (loginError) => {
        console.log("loginError", loginError)
      });
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
    FlowRouter.go(`/${value}/campaigns`)
    console.log("value!", value)
  }
  renderUserMenu(user) {
    const { organizations } = this.props
    return (
      <div>
        <FlatButton
          label={user.emails[0].address}
          onTouchTap={this.handleTouchTap}
          primary
        />
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.handleRequestClose}
        >
          <Menu onChange={this.handleMenuChange}>
            { organizations.map((organization) => (
              <MenuItem
                key={organization._id}
                primaryText={organization.name}
                value={organization._id}
              />
            ))}
            <MenuItem primaryText="Sign out" />
          </Menu>
        </Popover>

      </div>
    )
  }

  renderLoginButton() {

    return (
      <LoginForm />
    )
  }
  render() {
    const { user } = this.props
    console.log("METEOR USER in login", user)
    // return (<div>Hihi</div>)
    return (
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup float="left">
          <ToolbarTitle>Townsquare Texter</ToolbarTitle>
        </ToolbarGroup>
        <ToolbarGroup float="right">
          { user ? this.renderUserMenu(user) : this.renderLoginButton()}
        </ToolbarGroup>
      </Toolbar>
    )
  }
}
