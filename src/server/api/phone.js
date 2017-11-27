import { GraphQLScalarType } from 'graphql'
import { GraphQLError } from 'graphql/error'
import { Kind } from 'graphql/language'

const identity = value => value

// Regex taken from http://stackoverflow.com/questions/6478875/regular-expression-matching-e-164-formatted-phone-numbers
const pattern = /^\+[1-9]\d{1,14}$/

export const GraphQLPhone = new GraphQLScalarType({
  name: 'Phone',
  description: 'Phone number',
  parseValue: identity,
  serialize: identity,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Query error: Can only parse strings got a: ${ast.kind}`, [ast])
    }

    if (!pattern.test(ast.value)) {
      throw new GraphQLError('Query error: Not a valid Phone', [ast])
    }

    return ast.value
  }
})
