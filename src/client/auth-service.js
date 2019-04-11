import auth0 from 'auth0-js'

const baseURL = window.BASE_URL || `${window.location.protocol}//${window.location.host}`

export function logout() {
  const webAuth = new auth0.WebAuth({
    domain: window.AUTH0_DOMAIN,
    clientID: window.AUTH0_CLIENT_ID
  })

  webAuth.logout({
    returnTo: `${baseURL}/logout-callback`,
    client_id: window.AUTH0_CLIENT_ID
  })
}

export function login(nextUrl) {
  const webAuth = new auth0.WebAuth({
    domain: window.AUTH0_DOMAIN,
    clientID: window.AUTH0_CLIENT_ID,
    redirectUri: `${baseURL}/login-callback`,
    responseType: 'code',
    state: nextUrl || '/',
    scope: 'openid profile email'
  })

  webAuth.authorize()
}
