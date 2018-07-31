import PropTypes from 'prop-types'
import React from 'react'
import Navigation from '../components/Navigation'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { withRouter } from 'react-router'
import { dataTest } from '../lib/attributes'

class AdminNavigation extends React.Component {
  urlFromPath(path) {
    const { organizationId } = this.props
    return `/admin/${organizationId}/${path}`
  }

  render() {
    const { organizationId, sections } = this.props
    return (
      <Navigation
        sections={sections.map((section) => ({
          ...section,
          url: this.urlFromPath(section.path)
        }))}
        switchListItem={
          <ListItem
            {...dataTest('navSwitchToTexter')}
            onClick={() => this.props.router.push(`/app/${organizationId}/todos`)}
          >
            <ListItemText primary='Switch to texter' />
          </ListItem>
        }
      />
    )
  }
}

AdminNavigation.propTypes = {
  data: PropTypes.object,
  organizationId: PropTypes.string,
  router: PropTypes.object,
  sections: PropTypes.array,
  params: PropTypes.object
}

export default withRouter(AdminNavigation)
