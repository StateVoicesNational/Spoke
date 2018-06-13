import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import ReduxThunk from 'redux-thunk'
import ApolloClientSingleton from '../network/apollo-client-singleton'

export default class Store {
  constructor(history, initialState = {}) {
    const rootReducer = combineReducers({
      apollo: ApolloClientSingleton.reducer(),
    })

    this.data = createStore(
      connectRouter(history)(rootReducer),
      initialState,
      compose(
        applyMiddleware(
          routerMiddleware(history),
          ApolloClientSingleton.middleware(),
          ReduxThunk.withExtraArgument(ApolloClientSingleton)
        ),
         typeof window === 'object' &&
         typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f
      )
    )
  }
}
