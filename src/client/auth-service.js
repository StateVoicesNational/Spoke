import theme from '../styles/theme'

export function logout() {
  const lock = new window.Auth0Lock(window.AUTH0_CLIENT_ID, window.AUTH0_DOMAIN)
  lock.logout({
    returnTo: window.AUTH0_LOGOUT_CALLBACK,
    client_id: window.AUTH0_CLIENT_ID
  })
}

export function login(nextUrl) {
  const lock = new window.Auth0Lock(window.AUTH0_CLIENT_ID, window.AUTH0_DOMAIN, {
    auth: {
      redirect: true,
      redirectUrl: window.AUTH0_LOGIN_CALLBACK,
      responseType: 'code',
      params: {
        state: nextUrl,
        scope: 'openid profile email'
      }
    },
    allowedConnections: ['Username-Password-Authentication'],
    languageDictionary: {
      title: 'Spoke',
      signUpTerms: 'I agree to the <a href="' + window.PRIVACY_URL + '" target="_new">terms of service and privacy policy</a>.'
    },
    mustAcceptTerms: true,
    closable: false,
    theme: {
      logo: '',
      primaryColor: theme.colors.green
    },
    additionalSignUpFields: [{
      name: 'given_name',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png',
      placeholder: 'first name'
    }, {
      name: 'family_name',
      placeholder: 'last name',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png'
    }, {
      name: 'cell',
      placeholder: 'cell phone',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png',
      validator: (cell) => ({
        valid: cell.length >= 10,
        hint: 'Must be a valid phone number'
      })
    }]
  })
  lock.show()
}

