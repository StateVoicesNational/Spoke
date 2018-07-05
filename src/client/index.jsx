import React from 'react'
import ReactDOM from 'react-dom'
import { Router, browserHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import MomentUtils from 'material-ui-pickers/utils/moment-utils'
import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider'
import { StyleSheet } from 'aphrodite'
import errorCatcher from './error-catcher'
import makeRoutes from '../routes'
import Store from '../store'
import { ApolloProvider } from 'react-apollo'
import ApolloClientSingleton from '../network/apollo-client-singleton'
import { login, logout } from './auth-service'

window.onerror = (msg, file, line, col, error) => { errorCatcher(error) }
window.addEventListener('unhandledrejection', (event) => { errorCatcher(event.reason) })
window.AuthService = {
  login,
  logout
}

const store = new Store(browserHistory, window.INITIAL_STATE)
const history = syncHistoryWithStore(browserHistory, store.data)

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES)

ReactDOM.render(
  <ApolloProvider store={store.data} client={ApolloClientSingleton}>
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Router history={history} routes={makeRoutes()} />
    </MuiPickersUtilsProvider>
  </ApolloProvider>,
  document.getElementById('mount')
)
