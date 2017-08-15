import React from 'react'
import TextField from 'material-ui/TextField'

const OrganizationJoinLink = ({ organizationUuid }) => {
  let baseUrl = 'http://base'
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin
  }

  const joinUrl = `${baseUrl}/${organizationUuid}/join`

  return (
    <div>
      <div>
        Send your texting volunteers this link! Once they sign up, they'll be available to be assigned to campaigns.
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
  organizationUuid: React.PropTypes.string
}

export default OrganizationJoinLink
