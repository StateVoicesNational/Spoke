export function GraphQLRequestError(err) {
  this.name = this.constructor.name
  this.message = err.message
  this.status = err.status
  this.stack = (new Error()).stack
}
GraphQLRequestError.prototype = Object.create(Error.prototype)
GraphQLRequestError.prototype.constructor = GraphQLRequestError

export function graphQLErrorParser(response) {
  if (response.errors && response.errors.length > 0) {
    const error = response.errors[0]
    let parsedError = null
    try {
      parsedError = JSON.parse(error.message)
    } catch (ex) {
      // Even if we can't parse an error messge into JSON, still render it as a string 
      // so that we still display some error message instead of no error message at all.
      parsedError = {status: 500, message: error.message}
    }
    if (parsedError) {
      return {
        status: parsedError.status,
        message: parsedError.message
      }
    }
    return {
      status: 500,
      message: 'There was an error with your request. Try again in a little bit!'
    }
  }
  return null
}
