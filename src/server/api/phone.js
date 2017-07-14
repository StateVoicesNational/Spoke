import { Kind } from 'graphql/language'
import { GraphQLError } from './errors'

export const schema = `
  scalar Phone
`
export const resolvers = {
  Phone: {
    __parseValue(value) {
      return value
    },
    __serialize(value) {
      return value
    },
    __parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse strings got a: ' + ast.kind, [ast])
      }

      // Regex taken from http://stackoverflow.com/questions/6478875/regular-expression-matching-e-164-formatted-phone-numbers
      const re = /^\+[1-9]\d{1,14}$/
      if (!re.test(ast.value)) {
        throw new GraphQLError('Query error: Not a valid Phone', [ast])
      }

      return ast.value
    }
  }
}
