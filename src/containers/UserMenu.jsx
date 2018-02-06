import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Popover from 'material-ui/Popover'
import Menu from 'material-ui/Menu'
import MenuItem from 'material-ui/MenuItem'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'
import IconButton from 'material-ui/IconButton'
import Avatar from 'material-ui/Avatar'
import { connect } from 'react-apollo'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'

const avatarSize = 28

class UserMenu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      anchorEl: null
    }
    this.handleReturn = this.handleReturn.bind(this)
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
    const { orgId } = this.props
    this.props.router.push(`/app/${orgId}/todos`)
    e.preventDefault()
  }


  renderAvatar(user, size) {
    // Material-UI seems to not be handling this correctly when doing serverside rendering
    const inlineStyles = {
      lineHeight: 2,
      textAlign: 'center'
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
          onTouchTap={this.handleTouchTap}
        >
          {this.renderAvatar(currentUser, avatarSize)}
        </IconButton>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          targetOrigin={{ horizontal: 'left', vertical: 'top' }}
          onRequestClose={this.handleRequestClose}
        >
          <Menu onChange={this.handleMenuChange}>
            <MenuItem
              primaryText={currentUser.displayName}
              leftIcon={this.renderAvatar(currentUser, 40)}
              disabled={!this.props.orgId}
              value={'account'}
            >
              {currentUser.email}
            </MenuItem>
            <Divider />
            <Subheader>Teams</Subheader>
            {currentUser.organizations.map((organization) => (
              <MenuItem
                key={organization.id}
                primaryText={organization.name}
                value={organization.id}
              />
            ))}
            <Divider />
            <MenuItem
              primaryText='Home'
              onClick={this.handleReturn}
            />
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
