import auth0 from 'auth0-js'

export function logout() {
  var webAuth = new auth0.WebAuth({
    domain: window.AUTH0_DOMAIN,
    clientID: window.AUTH0_CLIENT_ID,
  })

  webAuth.logout({
    returnTo: `${window.BASE_URL}/logout-callback`,
    client_id: window.AUTH0_CLIENT_ID
  })
}

export function login(nextUrl) {
  const webAuth = new auth0.WebAuth({
    domain: window.AUTH0_DOMAIN,
    clientID: window.AUTH0_CLIENT_ID,
    redirectUri: `${window.BASE_URL}/login-callback`,
    responseType: 'code',
    state: nextUrl || '/',
    scope: 'openid profile email'
  })

  webAuth.authorize()
}
