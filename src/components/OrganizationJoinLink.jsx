import React from 'react'
import TextField from 'material-ui/TextField'

const OrganizationJoinLink = ({ organizationUuid, campaignId }) => {
  let baseUrl = 'http://base'
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin
  }

  const joinUrl = `${baseUrl}/${organizationUuid}/join/${campaignId}`

  return (
    <div>
      <div>
        Send your texting volunteers this link! Once they sign up, they'll be automatically assigned to this campaign.
      </div>
      <TextField
        value={joinUrl}
        autoFocus
        onFocus={(event) => event.target.select()}
        fullWidth
      />
    </div>
  )
}

OrganizationJoinLink.propTypes = {
  organizationUuid: React.PropTypes.string,
  campaignId: React.PropTypes.string
}

export default OrganizationJoinLink
