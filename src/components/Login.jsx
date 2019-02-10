import PropTypes from 'prop-types'
import React from 'react'
import { isClient } from '../lib'

const Login = ({ location }) => {
  const auth0Strategy = window.PASSPORT_STRATEGY === 'auth0' || window.PASSPORT_STRATEGY === ''
  const auth0Login = isClient() && auth0Strategy
  console.log('authstrategy', auth0Strategy,
    'window.PASSPORT_STRATEGY === "auth0"', window.PASSPORT_STRATEGY === 'auth0',
    'window.PASSPORT_STRATEGY === ""', window.PASSPORT_STRATEGY === ''
  )
  return (
    <div>
      {auth0Login ? window.AuthService.login(location.query.nextUrl) : ''}
      {!auth0Login &&
        <form action='/login-callback' method='POST'>
          <input type='hidden' name='nextUrl' value={location.query.nextUrl} />
          <div>
            <label>email:</label>
            <input type='text' name='email' /><br />
          </div>
          <div>
            <label>Password:</label>
            <input type='password' name='password' />
          </div>
          <div>
            <input type='submit' value='Submit' />
          </div>
        </form>}
    </div>
  )
}

Login.propTypes = {
  location: PropTypes.object
}

export default Login
