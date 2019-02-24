import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'

import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'

import { isClient } from '../lib'
import UserEdit from '../containers/UserEdit'

const styles = StyleSheet.create({
  authFields: {
    display: 'flex',
    'flex-direction': 'column'
  },
  fieldContainer: {
    background: theme.colors.white,
    padding: '15px'
  },
  authContainer: {
    display: 'flex',
    'justify-content': 'center',
    'align-items': 'flex-start',
    height: '100vh',
    'padding-top': '10vh',
    background: theme.colors.veryLightGray
  },
  button: {
    border: 'none',
    background: theme.colors.lightGray,
    color: theme.colors.green,
    padding: '16px 16px',
    'font-size': '14px',
    'text-transform': 'uppercase',
    cursor: 'pointer',
    width: '50%',
    'transition-timing-function': 'linear',
    'transition-duration': '0.05s',
    ':disabled': {
      background: theme.colors.white,
      cursor: 'default',
      color: theme.colors.darkGreen
    }
  }
})

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
      <div className={css(styles.authContainer)}>
        {/* Use auth0 */}
        {auth0Login && window.AuthService.login(location.query.nextUrl)}

        {/* Show UserEdit component configured for login / signup */}
        {!auth0Login &&
          <div>
            {/* Only display sign up option if there is a nextUrl */}
            {location.search &&
              <section>
                <button
                  className={css(styles.button)}
                  type='button'
                  name='login'
                  onClick={this.handleClick}
                  disabled={this.state.active === 'login'}
                >
                  Log In
                </button>
                <button
                  className={css(styles.button)}
                  type='button'
                  name='signup'
                  onClick={this.handleClick}
                  disabled={this.state.active === 'signup'}
                >
                  Sign Up
                </button>
              </section >
            }
            <div className={css(styles.fieldContainer)}>
              <UserEdit
                authType={this.state.active}
                saveLabel={this.state.active === 'login' ? 'Log in' : 'Sign up'}
                router={router}
                location={location}
                style={css(styles.authFields)}
              />
            </div>
          </div>
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
