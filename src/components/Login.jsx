import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'

import { isClient } from '../lib'
import UserEdit from '../containers/UserEdit'

class Login extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      active: 'login'
    }
  }

  handleClick = e => {
    this.setState({ active: e.target.name })
  }

  render() {
    const auth0Strategy =
      window.PASSPORT_STRATEGY === 'auth0' ||
      window.PASSPORT_STRATEGY === ''
    const auth0Login = isClient() && auth0Strategy

    const { location, router } = this.props

    return (
      <div>
        {/* Use auth0 */}
        {auth0Login && window.AuthService.login(location.query.nextUrl)}

        <section>
          <button
            type='button'
            name='login'
            onClick={this.handleClick}
            disabled={this.state.active === 'login'}
          >
            Log in
          </button>
          <button
            type='button'
            name='signup'
            onClick={this.handleClick}
            disabled={this.state.active === 'signup'}
          >
            Sign up
          </button>
        </section >

        {/* Show UserEdit component configured for login */}
        {(!auth0Login && this.state.active === 'login') &&
          <UserEdit
            allowLogin
            saveLabel='Log in'
            router={router}
            location={location}
          />
        }

        {/* Show UserEdit component configured for sign up */}
        {(!auth0Login && this.state.active === 'signup') &&
          <UserEdit
            allowSetPassword
            saveLabel='Sign up'
            router={router}
            location={location}
          />
        }
      </div >
    )
  }
}

Login.propTypes = {
  location: PropTypes.object,
  router: PropTypes.object
}

export default withRouter(Login)
