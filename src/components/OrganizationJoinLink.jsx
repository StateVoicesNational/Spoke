import React from 'react'
import TextField from 'material-ui/TextField'

const OrganizationJoinLink = ({ organizationId }) => {
  let baseUrl = 'http://base'
  if (typeof window !== 'undefined')
    baseUrl = window.location.origin

  const joinUrl = `${baseUrl}/${organizationId}/join`

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

export default OrganizationJoinLink
