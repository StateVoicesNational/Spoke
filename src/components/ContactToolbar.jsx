import React, { Component } from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar'
import { getDisplayPhoneNumber } from '../lib/phone-format'
import { getLocalTime } from '../lib/timezones'
import { grey100 } from 'material-ui/styles/colors'

const inlineStyles = {
  toolbar: {
    backgroundColor: grey100
  },
  cellToolbarTitle: {
    fontSize: 14
  },
  locationToolbarTitle: {
    fontSize: 14
  },
  timeToolbarTitle: {
    fontSize: 14
  }
}


class ContactToolbar extends Component {
  render() {
    const { campaignContact, rightToolbarIcon } = this.props

    const { location } = campaignContact

    let city = ''
    let state = ''
    let timezone = null
    let offset = 0
    let hasDST = false

    if (location) {
      city = location.city
      state = location.state
      timezone = location.timezone
      if (timezone) {
        offset = timezone.offset
        hasDST = timezone.hasDST
      }
    }

    let formattedLocation = `${city}`
    if (city && state) {
      formattedLocation = `${formattedLocation}, `
    }
    formattedLocation = `${formattedLocation} ${state}`

    const formattedLocalTime = getLocalTime(offset, hasDST).format('h:mm a')
    return (
      <div>
        <Toolbar
          style={inlineStyles.toolbar}
        >
          <ToolbarGroup >
            <ToolbarTitle
              text={campaignContact.firstName}
            />
            <ToolbarTitle
              text={getDisplayPhoneNumber(campaignContact.cell)}
              style={inlineStyles.cellToolbarTitle}
            />
            {location ? (
              <ToolbarTitle
                text={formattedLocalTime}
                style={inlineStyles.timeToolbarTitle}
              />) : ''
            }
            {location ? (
              <ToolbarTitle
                text={formattedLocation}
                style={inlineStyles.locationToolbarTitle}
              />) : ''}
            {rightToolbarIcon}
          </ToolbarGroup>
        </Toolbar>
      </div>
    )
  }
}

ContactToolbar.propTypes = {
  campaignContact: React.PropTypes.object, // contacts for current assignment
  rightToolbarIcon: React.PropTypes.element
}

export default ContactToolbar
