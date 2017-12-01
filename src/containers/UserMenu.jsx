import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Popover from 'material-ui/Popover'
import Menu from 'material-ui/Menu'
import MenuItem from 'material-ui/MenuItem'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'
import IconButton from 'material-ui/IconButton'
import Avatar from 'material-ui/Avatar'
import { ListItem } from 'material-ui/List'
import { withRouter } from 'react-router'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const avatarSize = 28

class UserMenu extends Component {
  state = {
    open: false,
    anchorEl: null
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
    if (value === 'logout') {
      window.AuthService.logout()
    } else {
      this.props.router.push(`/admin/${value}`)
    }
    this.handleRequestClose()
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
          <ListItem
            disabled
            primaryText={currentUser.displayName}
            secondaryText={currentUser.email}
            leftAvatar={this.renderAvatar(currentUser, 40)}
          />
          <Divider />
          <Menu onChange={this.handleMenuChange}>
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
  router: PropTypes.object
}

// const mapQueriesToProps = () => ({
//   data: {
//     query: gql`query getCurrentUserForMenu {
//       currentUser {
//         id
//         displayName
//         email
//         organizations {
//           id
//           name
//         }
//       }
//     }`,
//     forceFetch: true
//   }
// })

const query = graphql(gql`
  query getCurrentUserForMenu {
    currentUser {
      id
      displayName
      email
      organizations {
        id
        name
      }
    }
  }
`)

export default compose(query, withRouter)(UserMenu)
