import PropTypes from 'prop-types'
import React from 'react'
import { isClient } from '../lib'

const Login = ({ location }) => (
  <div>
    {isClient() ? '' /*window.AuthService.login(location.query.nextUrl)*/ : ''}
    <form action="/login-callback" method="POST">
      <input type="hidden" name="nextUrl" value={location.query.nextUrl} />
      <div>
        <label>email:</label>
        <input type="text" name="email"/><br/>
      </div>
      <div>
	<label>Password:</label>
	<input type="password" name="password"/>
      </div>
      <div>
	<input type="submit" value="Submit"/>
      </div>
    </form>
  </div>
)

Login.propTypes = {
  location: PropTypes.object
}

export default Login
