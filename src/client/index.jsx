import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloProvider } from 'react-apollo'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import { createBrowserHistory } from 'history'

import { StyleSheet } from 'aphrodite'
import errorCatcher from './error-catcher'
import makeRoutes from '../routes'
import Store from '../store'
import ApolloClientSingleton from '../network/apollo-client-singleton'
import { login, logout } from './auth-service'

window.onerror = (msg, file, line, col, error) => { errorCatcher(error) }
window.addEventListener('unhandledrejection', (event) => { errorCatcher(event.reason) })
window.AuthService = {
  login,
  logout
}
const history = createBrowserHistory()
const store = new Store(history, window.INITIAL_STATE)

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES)

ReactDOM.render(
  <ApolloProvider store={store.data} client={ApolloClientSingleton}>
    <Provider store={store}>
      <ConnectedRouter history={history}>
        {makeRoutes()}
      </ConnectedRouter>
    </Provider>
  </ApolloProvider>,
  document.getElementById('mount')
)
