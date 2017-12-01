import { log } from '../lib'
import fetch from 'isomorphic-fetch'

import { ApolloClient, InMemoryCache } from 'apollo-client-preset'
import { createHttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error'


const httpLink = createHttpLink({
  uri: process.env.GRAPHQL_URL || '/graphql',
  credentials: 'same-origin'
})

const errorLink = onError(({ networkError, graphQLErrors }) => {
  if (networkError.statusCode === 401) {
    window.location = `/login?nextUrl=${window.location.pathname}`
  } else if (networkError.statusCode === 403) {
    window.location = '/'
  } else if (networkError.statusCode === 404) {
    window.location = '/404'
  }
})

const ApolloClientSingleton = new ApolloClient({
  link: errorLink.concat(httpLink),
  cache: new InMemoryCache()
})

export default ApolloClientSingleton
