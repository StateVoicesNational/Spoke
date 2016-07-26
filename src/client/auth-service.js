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
    closable: false,
    theme: 'mycroft',
    additionalSignUpFields: [{
      name: 'given_name',
      placeholder: 'first name'
    }, {
      name: 'family_name',
      placeholder: 'last name'
    }, {
      name: 'cell',
      placeholder: 'cell phone'
    }]
  })
  lock.show()
}

