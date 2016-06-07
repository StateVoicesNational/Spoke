import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import FlatButton from 'material-ui/FlatButton'
import Popover from 'material-ui/Popover';
import { LoginForm } from './login_form'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { userIsTexter, userIsAdmin } from '../../api/users/users'

const styles = {
  toolbar: {
    backgroundColor: 'white'
  },
  button: {
    color: 'white'
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
  }

  render() {
    const { user, toolbarStyle } = this.props

    const texterButton = userIsTexter(user) ? (
      <FlatButton
        style={styles.button}
        label='Your tasks'
        onTouchTap={() => FlowRouter.go('appDashboard')}
        primary
      />
    ) : ''
    const adminButton = userIsAdmin(user) ? (
      <FlatButton
        style={styles.button}
        label='Admin'
        onTouchTap={() => FlowRouter.go('adminDashboard')}
        primary
      />
    ) : ''
    return (
      <Toolbar style={_.extend(styles.toolbar, toolbarStyle || {})}>
        <ToolbarGroup
          float="left"
          firstChild
        />
        <ToolbarGroup
          float="right"
          lastChild
        >
          <div>
            { user ? [
              texterButton,
              adminButton
            ] : (
              <div>
                <FlatButton
                  style={styles.button}
                  label={ user ? user.emails[0].address : 'Create team' }
                  linkButton
                  href={ FlowRouter.path('createTeam') }
                  primary
                />

                <FlatButton
                  style={styles.button}
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
                  <LoginForm onSubmit={() => FlowRouter.go( userIsAdmin(Meteor.user()) ? 'adminDashboard' : 'appDashboard')}/>
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
