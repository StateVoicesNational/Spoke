import PropTypes from 'prop-types'
import React from 'react'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { getDisplayPhoneNumber } from '../lib/phone-format'
import { getLocalTime , getContactTimezone } from '../lib/timezones'
import grey from '@material-ui/core/colors/grey'

const inlineStyles = {
  toolbar: {
    backgroundColor: grey[100]
  },
  cellToolbarTitle: {
    fontSize: '1em'
  },
  locationToolbarTitle: {
    fontSize: '1em'
  },
  timeToolbarTitle: {
    fontSize: '1em'
  }
}

const ContactToolbar = function ContactToolbar(props) {
  const { campaignContact, rightToolbarIcon } = props

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
      offset = timezone.offset || offset
      hasDST = timezone.hasDST || hasDST
    }
    const adjustedLocationTZ = getContactTimezone(location)
    if (adjustedLocationTZ && adjustedLocationTZ.timezone) {
      offset = adjustedLocationTZ.timezone.offset;
      hasDST = adjustedLocationTZ.timezone.hasDST;
    }
  }

  let formattedLocation = `${city}`
  if (city && state) {
    formattedLocation = `${formattedLocation}, `
  }
  formattedLocation = `${formattedLocation} ${state}`

  const formattedLocalTime = getLocalTime(offset, hasDST).format('LT') // format('h:mm a')
  return (
    <div>
      <Toolbar style={inlineStyles.toolbar}>
        <div>
          <Typography variant='title'>{campaignContact.firstName}</Typography>
          <Typography variant='title' style={inlineStyles.cellToolbarTitle} />
          {location &&
            <Typography variant='title' style={inlineStyles.timeToolbarTitle}>
              {formattedLocalTime}
            </Typography>
          }
          {location &&
            <Typography variant='title' style={inlineStyles.locationToolbarTitle}>
              {formattedLocation}
            </Typography>
          }
          {rightToolbarIcon}
        </div>
      </Toolbar>
    </div>
  )
}

ContactToolbar.propTypes = {
  campaignContact: PropTypes.object, // contacts for current assignment
  rightToolbarIcon: PropTypes.element
}

export default ContactToolbar
