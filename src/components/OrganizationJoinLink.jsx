import PropTypes from 'prop-types'
import React from 'react'
import DisplayLink from './DisplayLink'

const OrganizationJoinLink = ({ organizationUuid, campaignId }) => {
  let baseUrl = 'http://base'
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin
  }

  const joinUrl = ((campaignId)
    ? `${baseUrl}/${organizationUuid}/join/${campaignId}`
    : `${baseUrl}/${organizationUuid}/join`)

  const textContent = 'Send your texting volunteers this link! Once they sign up, they\'ll be automatically assigned to this campaign.'

  return (
    <DisplayLink url={joinUrl} textContent={textContent} />
  )
}

OrganizationJoinLink.propTypes = {
  organizationUuid: PropTypes.string,
  campaignId: PropTypes.string
}

export default OrganizationJoinLink
