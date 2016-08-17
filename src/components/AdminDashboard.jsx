import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'
import TopNav from './TopNav'
import Navigation from './Navigation'
import AlertBar from '../containers/AlertBar'
import { ListItem } from 'material-ui/List'
import { withRouter } from 'react-router'

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

  renderNavigation(sections) {
    const organizationId = this.props.params.organizationId
    if (organizationId === null) {
      return ''
    }
    return (
      <div className={css(styles.sideBar)}>
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
      </div>
    )
  }

  renderOrganizationAlertBar() {
    const organizationId = this.props.params.organizationId
    if (!organizationId) {
      return ''
    }
    return <AlertBar organizationId={organizationId} />
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
    } ]

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
          {this.renderNavigation(sections)}
          <div className={css(styles.content)}>
            {this.renderOrganizationAlertBar()}
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
