import PropTypes from 'prop-types'
import React from 'react'
import { isClient } from '../lib'

const Login = ({ location }) => (
  <div>
    {isClient() ? window.AuthService.login(location.query.nextUrl) : ''}
  </div>
)

Login.propTypes = {
  location: PropTypes.object
}

export default Login
