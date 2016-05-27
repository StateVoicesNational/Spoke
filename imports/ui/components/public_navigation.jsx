import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import FlatButton from 'material-ui/FlatButton'
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import { Fake } from 'meteor/anti:fake'
import { LoginForm } from './login_form'
import { FlowRouter } from 'meteor/kadira:flow-router'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader';

const styles = {
  toolbar: {
    backgroundColor: 'white'
  }
}
export class PublicNavigation extends Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false
    }
    this.handleRequestClose = this.handleRequestClose.bind(this)
    this.handleOpenUserMenu = this.handleOpenUserMenu.bind(this)
  }

  handleOpenUserMenu(event) {
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

  render() {
    const { user } = this.props
    return (
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup
          float="left"
          firstChild
        />
        <ToolbarGroup
          float="right"
          lastChild
        >
          <div>
            { user ? (
              <FlatButton
                label='Go to your teams'
                onTouchTap={this.handleOpenUserMenu}
                primary
              />
            ) : (
              <div>
                <FlatButton
                  label={ user ? user.emails[0].address : 'Create team' }
                  linkButton
                  href={ '/signup' }
                  primary
                />

                <FlatButton
                  label={ user ? user.emails[0].address : 'Log in' }
                  onTouchTap={this.handleOpenUserMenu}
                  primary
                />
                <Popover
                  open={this.state.open}
                  anchorEl={this.state.anchorEl}
                  anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                  targetOrigin={{horizontal: 'left', vertical: 'top'}}
                  onRequestClose={this.handleRequestClose}
                >
                  <LoginForm />
                </Popover>
              </div>
            )
            }
          </div>
        </ToolbarGroup>
      </Toolbar>
    )
  }
}
