import { createNetworkInterface } from 'apollo-client'
import fetch from 'isomorphic-fetch' // eslint-disable-line no-unused-vars

class ResponseMiddlewareNetworkInterface {
  constructor(endpoint = '/graphql', options = {}) {
    this.defaultNetworkInterface = createNetworkInterface(endpoint, options)
    this.responseMiddlewares = []
  }

  use(responseMiddleware) {
    let responseMiddlewares = responseMiddleware
    if (!Array.isArray(responseMiddlewares)) {
      responseMiddlewares = [responseMiddlewares]
    }
    responseMiddlewares.forEach((middleware) => {
      if (typeof middleware.applyMiddleware === 'function') {
        this.defaultNetworkInterface.use([middleware])
      } else if (typeof middleware.applyResponseMiddleware === 'function') {
        this.responseMiddlewares.push(middleware)
      } else {
        throw new Error('Middleware must implement the applyMiddleware or applyResponseMiddleware functions')
      }
    })
  }

  async applyResponseMiddlewares(response) {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      const queue = async (funcs) => {
        const next = async () => {
          if (funcs.length > 0) {
            const f = funcs.shift()
            f.applyResponseMiddleware(response, next)
          } else {
            resolve(response)
          }
        }
        next()
      }

      queue([...this.responseMiddlewares])
    })
  }

  async query(request) {
    let response = await this.defaultNetworkInterface.query(request)
    response = await this.applyResponseMiddlewares(response)
    return response
  }
}

export default ResponseMiddlewareNetworkInterface
