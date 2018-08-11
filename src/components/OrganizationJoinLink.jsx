import PropTypes from 'prop-types'
import React from 'react'
import TextField from 'material-ui/TextField'
import { dataTest } from '../lib/attributes'

const OrganizationJoinLink = ({ organizationUuid, campaignId }) => {
  let baseUrl = 'http://base'
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin
  }

  const joinUrl = ((campaignId)
                   ? `${baseUrl}/${organizationUuid}/join/${campaignId}`
                   : `${baseUrl}/${organizationUuid}/join`)

  return (
    <div>
      <div>
        Send your texting volunteers this link! Once they sign up, they'll be automatically assigned to this campaign.
      </div>
      <TextField
        {...dataTest('joinUrl')}
        value={joinUrl}
        autoFocus
        onFocus={(event) => event.target.select()}
        fullWidth
      />
    </div>
  )
}

OrganizationJoinLink.propTypes = {
  organizationUuid: PropTypes.string,
  campaignId: PropTypes.string
}

export default OrganizationJoinLink
