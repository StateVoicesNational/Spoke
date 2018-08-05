import PropTypes from 'prop-types'
import React from 'react'
import Navigation from '../components/Navigation'
import { ListItem } from 'material-ui/List'
import { withRouter } from 'react-router'
import { dataTest } from '../lib/attributes'

class AdminNavigation extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      showMenu: true
    }

    this.handleToggleMenu = this.handleToggleMenu.bind(this)
  }

  async handleToggleMenu() {
    await this.setState({
      showMenu: !this.state.showMenu
    })
    this.props.onToggleMenu()
  }

  urlFromPath(path) {
    const { organizationId } = this.props
    return `/admin/${organizationId}/${path}`
  }

  render() {
    const { organizationId, sections } = this.props
    if (this.state.showMenu) {
      return (
        <Navigation
          onToggleMenu={this.handleToggleMenu}
          showMenu={this.state.showMenu}
          sections={sections.map(section => ({
            ...section,
            url: this.urlFromPath(section.path)
          }))}
          switchListItem={
            <ListItem
              {...dataTest('navSwitchToTexter')}
              primaryText="Switch to texter"
              onTouchTap={() =>
                this.props.router.push(`/app/${organizationId}/todos`)
              }
            />
          }
        />
      )
    } else {
      return <div />
    }
  }
}

AdminNavigation.defaultProps = {
  showMenu: true
}

AdminNavigation.propTypes = {
  data: PropTypes.object,
  organizationId: PropTypes.string,
  router: PropTypes.object,
  sections: PropTypes.array,
  params: PropTypes.object,
  onToggleMenu: PropTypes.func.isRequired,
  showMenu: PropTypes.bool
}

export default withRouter(AdminNavigation)
