import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error'
import { log } from '../lib'

const responseMiddlewareNetworkInterface = new ResponseMiddlewareNetworkInterface(
  process.env.GRAPHQL_URL || '/graphql', { credentials: 'same-origin' }
)

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
  } else {
    log.error(`GraphQL request resulted in error:\nRequest:${JSON.stringify(response.data)}\nError:${JSON.stringify(response.errors)}`)
  }
})

// TODO: query merging
const networkInterface = addQueryMerging(responseMiddlewareNetworkInterface)

// TODO: {shouldBatch: true, dataIdFromObject: (result) => result.id}
const ApolloClientSingleton = new ApolloClient({
  link: errorLink.concat(httpLink),
  cache: new InMemoryCache()
})
export default ApolloClientSingleton
