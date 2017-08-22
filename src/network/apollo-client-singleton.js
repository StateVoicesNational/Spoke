import ApolloClient, { addQueryMerging } from 'apollo-client'
import ResponseMiddlewareNetworkInterface from './response-middleware-network-interface'
import { log } from '../lib'
import fetch from 'isomorphic-fetch'
import { graphQLErrorParser } from './errors'

const responseMiddlewareNetworkInterface = new ResponseMiddlewareNetworkInterface(
    '/graphql', { credentials: 'same-origin' }
  )

responseMiddlewareNetworkInterface.use({
  applyResponseMiddleware: (response, next) => {
    const parsedError = graphQLErrorParser(response)
    if (parsedError) {
      log.debug(parsedError)
      if (parsedError.status === 401) {
        window.location = `/login?nextUrl=${window.location.pathname}`
      } else if (parsedError.status === 403) {
        window.location = '/'
      } else if (parsedError.status === 404) {
        window.location = '/404'
      } else {
        log.error(`GraphQL request resulted in error:\nRequest:${JSON.stringify(response.data)}\nError:${JSON.stringify(response.errors)}`)
      }
    }
    next()
  }
})

const networkInterface = addQueryMerging(responseMiddlewareNetworkInterface)

const ApolloClientSingleton = new ApolloClient({
  networkInterface,
  shouldBatch: true,
  dataIdFromObject: (result) => result.id
})
export default ApolloClientSingleton
