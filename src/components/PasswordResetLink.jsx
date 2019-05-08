import PropTypes from 'prop-types'
import React from 'react'
import DisplayLink from './DisplayLink'

const PasswordResetLink = ({ passwordResetHash }) => {
  let baseUrl = 'http://base'
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin
  }

  const url = `${baseUrl}/reset/${passwordResetHash}`
  const textContent = 'Send your texting volunteer this link! Once they try to log in, they\'ll be asked to create a new password. Please note that the link expires in 15 minutes, after which a new link will need to be generated.'

  return (
    <DisplayLink url={url} textContent={textContent} />
  )
}

PasswordResetLink.propTypes = {
  passwordResetHash: PropTypes.string
}

export default PasswordResetLink
