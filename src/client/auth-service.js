import theme from '../styles/theme'

export function login(nextUrl) {
  const lock = new Auth0Lock(window.AUTH0_CLIENT_ID, 'gearshift.auth0.com', {
    auth: {
      redirect: true,
      redirectUrl: window.AUTH0_LOGIN_CALLBACK,
      responseType: 'code',
      params: {
        state: nextUrl
      }
    },
    languageDictionary: {
      title: 'Spoke',
      signUpTerms: "I agree to the <a href='/terms' target='_new'>terms of service</a> and <a href='/privacy' target='_new'>privacy policy</a>."
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

