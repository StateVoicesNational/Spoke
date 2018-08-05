import PropTypes from 'prop-types'
import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'
import { hasRole } from '../lib'
import TopNav from './TopNav'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import loadData from '../containers/hoc/load-data'
import AdminNavigation from '../containers/AdminNavigation'
const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container
  },
  sideBar: {
    width: 256,
    minHeight: 'calc(100vh - 56px)'
  },
  content: {
    ...theme.layouts.multiColumn.flexColumn,
    paddingLeft: '2rem',
    paddingRight: '2rem',
    margin: '24px auto'
  }
})

class AdminDashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showMenu: true
    }

    this.handleToggleMenu = this.handleToggleMenu.bind(this)
  }
  urlFromPath(path) {
    const organizationId = this.props.params.organizationId
    return `/admin/${organizationId}/${path}`
  }

  async handleToggleMenu() {
    await this.setState({showMenu: !this.state.showMenu})
  }

  renderNavigation(sections) {
    const organizationId = this.props.params.organizationId

    if (!organizationId) {
      return ''
    }
    if (this.state.showMenu) {
      return (
        <div className={css(styles.sideBar)}>
          <AdminNavigation
            onToggleMenu={this.handleToggleMenu}
            showMenu={this.state.showMenu}
            organizationId={organizationId}
            sections={sections}
          />
        </div>
      )
    }
    else {
      return (
        <div style={{writingMode: 'vertical-rl', padding: '5px', paddingTop: '20px'}} onClick={this.handleToggleMenu}>
          SHOW MENU
        </div>
      )
    }
  }

  // TODO get rid of showMenu property
  // TODO MAYBE add property to include closeMenu button

  render() {
    const { location, children, params } = this.props
    const { roles } = this.props.data.currentUser

    // HACK: Setting params.adminPerms helps us hide non-supervolunteer functionality
    params.adminPerms = hasRole('ADMIN', roles || [])

    const sections = [{
      name: 'Campaigns',
      path: 'campaigns',
      role: 'SUPERVOLUNTEER'
    }, {
      name: 'People',
      path: 'people',
      role: 'ADMIN'
    }, {
      name: 'Optouts',
      path: 'optouts',
      role: 'ADMIN'
    }, {
      name: 'Message Review',
      path: 'incoming',
      role: 'SUPERVOLUNTEER'
    }, {
      name: 'Settings',
      path: 'settings',
      role: 'SUPERVOLUNTEER'
    }]

    let currentSection = sections.filter(
      (section) => location.pathname.match(`/${section.path}`)
    )

    currentSection = currentSection.length > 0 ? currentSection.shift() : null
    const title = currentSection ? currentSection.name : 'Admin'
    const backToURL = currentSection &&
      location.pathname.split('/').pop() !== currentSection.path ?
      this.urlFromPath(currentSection.path) :
      null

    return (
      <div>
        <TopNav title={title} backToURL={backToURL} orgId={params.organizationId} />
        <div className={css(styles.container)}>
          {this.renderNavigation(sections.filter((s) => hasRole(s.role, roles)))}
          <div className={css(styles.content)}>
            {children}
          </div>
        </div>
      </div>
    )
  }
}

AdminDashboard.propTypes = {
  router: PropTypes.object,
  params: PropTypes.object,
  children: PropTypes.object,
  location: PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getCurrentUserRoles($organizationId: String!) {
      currentUser {
        id
        roles(organizationId: $organizationId)
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  }
})

export default loadData(withRouter(AdminDashboard), { mapQueriesToProps })
