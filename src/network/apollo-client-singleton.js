import ApolloClient, { addQueryMerging } from 'apollo-client'
import ResponseMiddlewareNetworkInterface from './response-middleware-network-interface'
import { log } from '../lib'
import fetch from 'isomorphic-fetch'
import { graphQLErrorParser } from './errors'

const graphqlURL = process.env.NODE_ENV === 'development' 
  ? process.env.GRAPHQL_URL || (process.env.BASE_URL + '/graphql') 
  : '/graphql'
console.log('graphqlURL ', graphqlURL)
const responseMiddlewareNetworkInterface = new ResponseMiddlewareNetworkInterface(
    graphqlURL, { credentials: 'same-origin' }
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
