import PropTypes from 'prop-types'
import React from 'react'
import Navigation from '../components/Navigation'
import { ListItem } from 'material-ui/List'
import { withRouter } from 'react-router'

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
            {...(process.env.NODE_ENV !== 'production' && { 'data-test': 'switchToTexter' })}
            primaryText='Switch to texter'
            onTouchTap={() => this.props.router.push(`/app/${organizationId}/todos`)}
          />
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
