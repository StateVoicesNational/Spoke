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
import { dataTest } from '../lib/attributes'
import { hasRole } from '../lib/permissions'

const avatarSize = 28

class OrganizationItemInner extends Component {
  componentDidMount() {
    this.updateHasTeam()
  }

  componentDidUpdate() {
    this.updateHasTeam()
  }

  isAdminOfOrg = () => {
    if (this.props.data.loading) {
      return false
    }
    const roles = this.props.data.currentUser.roles || []
    return hasRole('SUPERVOLUNTEER', roles)
  }

  updateHasTeam = () => {
    this.props.handleHasTeam(this.isAdminOfOrg())
  }

  handleClick = (event) => {
    event.preventDefault()
    this.props.router.push(`/admin/${this.props.organization.id}`)
  }

  render() {
    const { organization } = this.props

    if (!this.isAdminOfOrg()) {
      return <div />
    }

    return (
      <MenuItem
        primaryText={organization.name}
        value={organization.id}
        onClick={this.handleClick}
      />
    )
  }
}

const orgRoleProps = ({ ownProps }) => ({
  data: {
    query: gql`query getCurrentUserRoles($organizationId: String!) {
      currentUser {
        id
        roles(organizationId: $organizationId)
      }
    }`,
    variables: {
      organizationId: ownProps.organization.id
    }
  }
})

const OrganizationItem = connect({
  mapQueriesToProps: orgRoleProps
})(withRouter(OrganizationItemInner))

class TeamMenu extends Component {
  constructor(props) {
    super(props)

    this.state = {
      hasTeams: false
    }
  }

  handleHasTeam = (hasTeam) => {
    this.setState((currentState, currentProps) => ({
      hasTeams: currentState.hasTeams || hasTeam
    }))
  }

  render() {
    return (
      <div>
        {this.state.hasTeams &&
          <div>
            <Divider />
            <Subheader>Teams</Subheader>
          </div>
        }
        {this.props.organizations.map((organization) => (
          <OrganizationItem
            key={organization.id}
            organization={organization}
            handleHasTeam={this.handleHasTeam}
          />
        ))}
      </div>
    )
  }
}

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
          {...dataTest('userMenuButton')}
          onTouchTap={this.handleTouchTap}
          iconStyle={{ fontSize: '18px' }}
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
              {...dataTest('userMenuDisplayName')}
              primaryText={currentUser.displayName}
              leftIcon={this.renderAvatar(currentUser, 40)}
              disabled={!this.props.orgId}
              value={'account'}
            >
              {currentUser.email}
            </MenuItem>
            <TeamMenu organizations={currentUser.organizations} />
            <Divider />
            <MenuItem
              {...dataTest('home')}
              primaryText='Home'
              onClick={this.handleReturn}
            />
            <MenuItem
              primaryText='FAQs'
              onClick={this.handleRequestFaqs}
            />
            <Divider />
            <MenuItem
              {...dataTest('userMenuLogOut')}
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
