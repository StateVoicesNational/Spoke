import PropTypes from 'prop-types'
import React from 'react'
import Navigation from '../components/Navigation'
import { ListItem } from 'material-ui/List'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'
import { getHighestRole } from '../lib'

class AdminNavigation extends React.Component {
  urlFromPath(path) {
    const { organizationId } = this.props
    return `/admin/${organizationId}/${path}`
  }

  renderNavigation(sections) {
    const { organizationId } = this.props
    return (
      <Navigation
        sections={sections.map((section) => ({
          ...section,
          url: this.urlFromPath(section.path)
        }))}
        switchListItem={
          <ListItem
            primaryText='Switch to texter'
            onTouchTap={() => this.props.router.push(`/app/${organizationId}/todos`)}
          />
        }
      />
    )
  }

  render() {
    const sections = [{
      name: 'Campaigns',
      path: 'campaigns'
    }, {
      name: 'People',
      path: 'people'
    }, {
      name: 'Optouts',
      path: 'optouts'
    }, {
      name: 'Incoming Messages',
      path: 'incoming'
    }]

    const { roles } = this.props.data.currentUser

    if (getHighestRole(roles) === 'OWNER') {
      sections.push({
        name: 'Settings',
        path: 'settings'
      })
    }

    return this.renderNavigation(sections)
  }
}

AdminNavigation.propTypes = {
  data: PropTypes.object,
  organizationId: PropTypes.string,
  router: PropTypes.object,
  params: PropTypes.object
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
      organizationId: ownProps.organizationId
    },
    forceFetch: true
  }
})

export default loadData(withRouter(AdminNavigation), { mapQueriesToProps })
