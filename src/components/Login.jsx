import PropTypes from 'prop-types'
import React from 'react'

import { isClient } from '../lib'
import UserEdit from '../containers/UserEdit'

const Login = ({ location }) => {
  const auth0Strategy =
    window.PASSPORT_STRATEGY === 'auth0' ||
    window.PASSPORT_STRATEGY === ''
  const auth0Login = isClient() && auth0Strategy

  return (
    <div>
      {auth0Login ? window.AuthService.login(location.query.nextUrl) : ''}
      {!auth0Login && <UserEdit allowLogin saveLabel='Log in' />}
    </div>
  )
}

Login.propTypes = {
  location: PropTypes.object
}

export default Login
