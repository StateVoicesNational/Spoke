import { Kind } from 'graphql/language'

export const schema = `
  scalar Date
`

export const resolvers = {
  Date: {
    __parseValue(value) {
      return new Date(value)
    },
    __serialize(value) {
      if (value === null) {
        return null
      } else if (!(value instanceof Date)) {
        throw new Error('Field error: value is not an instance of Date')
      }

      return value.toJSON()
    },
    __parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new Error(`Query error: Can only parse strings to dates but got a: ${ast.kind}`)
      }
      const result = new Date(ast.value)
      if (isNaN(result.getTime())) {
        throw new Error('Query error: Invalid date')
      }
      if (ast.value !== result.toJSON()) {
        throw new Error('Query error: Invalid date format, only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ')
      }
      return result
    }
  }
}
