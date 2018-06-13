import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

import Popover from '@material-ui/core/Popover';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';

const avatarSize = 28

class UserMenu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      anchorEl: null
    }
    this.handleReturn = this.handleReturn.bind(this)
    this.handleRequestFaqs = this.handleRequestFaqs.bind(this)
  }

  handleTouchTap = (event) => {
    // This prevents ghost click.
    event.preventDefault()

    this.setState({
      open: true,
      anchorEl: event.currentTarget
    })
  }

  handleRequestClose = () => {
    this.setState({
      open: false
    })
  }

  // TODO: material-ui
  // These should be moved inline per MenuItem
  handleMenuChange = (event, value) => {
    this.handleRequestClose()
    if (value === 'logout') {
      window.AuthService.logout()
    } else if (value === 'account') {
      const { orgId } = this.props
      const { currentUser } = this.props.data
      if (orgId) {
        this.props.router.push(`/app/${orgId}/account/${currentUser.id}`)
      }
    } else {
      this.props.router.push(`/admin/${value}`)
    }
  }

  handleReturn = (e) => {
    e.preventDefault()
    const { orgId } = this.props
    this.props.router.push(`/app/${orgId}/todos`)
  }

  handleRequestFaqs = (e) => {
    e.preventDefault()
    const { orgId } = this.props
    this.props.router.push(`/app/${orgId}/faqs`)
  }


  renderAvatar(user, size) {
    // Material-UI seems to not be handling this correctly when doing serverside rendering
    const inlineStyles = {
      lineHeight: '1.25',
      textAlign: 'center',
      color: 'white',
      padding: '5px'
    }
    return <Avatar style={inlineStyles} size={size}>{user.displayName.charAt(0)}</Avatar>
  }

  render() {
    const { currentUser } = this.props.data
    if (!currentUser) {
      return <div />
    }

    return (
      <div>
        <IconButton
          onClick={this.handleTouchTap}
          iconStyle={{ fontSize: '18px' }}
        >
          {this.renderAvatar(currentUser, avatarSize)}
        </IconButton>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          onClose={this.handleRequestClose}
        >
          <Menu onChange={this.handleMenuChange} subheader={<li />}>
            <MenuItem
              disabled={!this.props.orgId}
              value="account"
            >
              <ListItemIcon>
                {this.renderAvatar(currentUser, 40)}
              </ListItemIcon>
              <ListItemText
                inset={true}
                primary={currentUser.displayName}
                secondary={currentUser.email}
              />
            </MenuItem>
            <Divider />
            <ListSubheader>Teams</ListSubheader>
            {currentUser.organizations.map((organization) => (
              <MenuItem key={organization.id}>
                {organization.name}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={this.handleReturn}>Home</MenuItem>
            <MenuItem onClick={this.handleRequestFaqs}>FAQs</MenuItem>
            <Divider />
            <MenuItem
              primaryText='Log out'
              value='logout'
            />
          </Menu>
        </Popover>
      </div>
    )
  }
}

UserMenu.propTypes = {
  data: PropTypes.object,
  orgId: PropTypes.string,
  router: PropTypes.object
}

const mapQueriesToProps = () => ({
  data: {
    query: gql`query getCurrentUserForMenu {
      currentUser {
        id
        displayName
        email
        organizations {
          id
          name
        }
      }
    }`,
    forceFetch: true
  }
})

export default connect({
  mapQueriesToProps
})(withRouter(UserMenu))
