import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'
import TopNav from './TopNav'
import { withRouter } from 'react-router'
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
  urlFromPath(path) {
    const organizationId = this.props.params.organizationId
    return `/admin/${organizationId}/${path}`
  }

  renderNavigation() {
    const organizationId = this.props.params.organizationId
    if (!organizationId) {
      return ''
    }
    return (
      <div className={css(styles.sideBar)}>
        <AdminNavigation
          organizationId={organizationId}
        />
      </div>
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
      name: 'Billing',
      path: 'billing'
    }]

    const { location, children } = this.props
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
        <TopNav title={title} backToURL={backToURL} />
        <div className={css(styles.container)}>
          {this.renderNavigation()}
          <div className={css(styles.content)}>
            {children}
          </div>
        </div>
      </div>
    )
  }
}

AdminDashboard.propTypes = {
  router: React.PropTypes.object,
  params: React.PropTypes.object,
  children: React.PropTypes.object,
  location: React.PropTypes.object
}

export default withRouter(AdminDashboard)
