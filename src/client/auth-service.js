import auth0 from "auth0-js";

const baseURL =
  window.BASE_URL || `${window.location.protocol}//${window.location.host}`;

const loginStrategies = {
  auth0: {
    login(nextUrl) {
      const webAuth = new auth0.WebAuth({
        domain: window.AUTH0_DOMAIN,
        clientID: window.AUTH0_CLIENT_ID,
        redirectUri: `${baseURL}/login-callback`,
        responseType: "code",
        state: nextUrl || "/",
        scope: "openid profile email"
      });

      webAuth.authorize();
    },

    logout() {
      const webAuth = new auth0.WebAuth({
        domain: window.AUTH0_DOMAIN,
        clientID: window.AUTH0_CLIENT_ID
      });

      webAuth.logout({
        returnTo: `${baseURL}/logout-callback`,
        client_id: window.AUTH0_CLIENT_ID
      });
    }
  },

  slack: {
    login(nextUrl) {
      let queryParams = "";
      if (nextUrl) {
        queryParams = `?nextUrl=${encodeURIComponent(nextUrl)}`;
      }

      document.location.href = `${baseURL}/login/slack-redirect${queryParams}`;
    },

    logout() {
      document.location.href = `${baseURL}/logout-callback`;
    }
  },

  local: {
    login() {
      // handled by React login component
    },
    logout() {
      document.location.href = `${baseURL}/logout-callback`;
    }
  }
};

export function logout() {
  loginStrategies[window.PASSPORT_STRATEGY].logout();
}

export function login(nextUrl) {
  loginStrategies[window.PASSPORT_STRATEGY].login(nextUrl);
}
