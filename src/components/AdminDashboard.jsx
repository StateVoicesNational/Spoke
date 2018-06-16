import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import { Query } from "react-apollo";
import { StyleSheet, css } from 'aphrodite'

import { hasRole } from '../lib'
import LoadingIndicator from '../components/LoadingIndicator'
import TopNav from './TopNav'
import AdminNavigation from '../containers/AdminNavigation'
import theme from '../styles/theme'

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

const GET_USER_ROLES = gql`
  query getCurrentUserRoles($organizationId: String!) {
    currentUser {
      id
      roles(organizationId: $organizationId)
    }
  }
`

class AdminDashboard extends React.Component {
  urlFromPath(path) {
    const organizationId = this.props.params.organizationId
    return `/admin/${organizationId}/${path}`
  }

  renderNavigation(sections) {
    const organizationId = this.props.params.organizationId
    if (!organizationId) {
      return ''
    }
    return (
      <div className={css(styles.sideBar)}>
        <AdminNavigation
          organizationId={organizationId}
          sections={sections}
        />
      </div>
    )
  }

  render() {
    const organizationId = this.props.params.organizationId

    return (
      <Query query={GET_USER_ROLES} variables={{organizationId}}>
        {({ loading, error, data }) => {
          if (loading) return <LoadingIndicator />

          const { location, children, params } = this.props
          const { roles } = data.currentUser

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
            name: 'Incoming Messages',
            path: 'incoming',
            role: 'SUPERVOLUNTEER'
          }, {
            name: 'Settings',
            path: 'settings',
            role: 'SUPERVOLUNTEER'
          }]

          let currentSection = sections.filter(section => {
            return location.pathname.match(`/${section.path}`)
          })

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
        }}
      </Query>
    )
  }
}

AdminDashboard.propTypes = {
  router: PropTypes.object,
  params: PropTypes.object,
  children: PropTypes.object,
  location: PropTypes.object
}

export default withRouter(AdminDashboard)
