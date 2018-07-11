import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloProvider } from 'react-apollo'
import { createBrowserHistory } from 'history'
import { BrowserRouter } from 'react-router-dom'

import { StyleSheet } from 'aphrodite'
import errorCatcher from './error-catcher'
import makeRoutes from '../routes'
import Store from '../store'
import ApolloClientSingleton from '../network/apollo-client-singleton'
import { login, logout } from './auth-service'
import App from '../components/App'

window.onerror = (msg, file, line, col, error) => { errorCatcher(error) }
window.addEventListener('unhandledrejection', (event) => { errorCatcher(event.reason) })
window.AuthService = {
  login,
  logout
}
const history = createBrowserHistory()
const store = new Store(history, {})

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES)

ReactDOM.render(
  <ApolloProvider store={store.data} client={ApolloClientSingleton}>
    <App>
      <BrowserRouter>
        {makeRoutes()}
      </BrowserRouter>
    </App>
  </ApolloProvider>,
  document.getElementById('mount')
)
