//  Credit: https://github.com/taion/graphql-type-json/blob/master/src/index.js
import { Kind } from 'graphql/language';

export const schema = `
  scalar JSON
`

export const resolvers = {
    JSON: {
      __serialize: identity,
      __parseValue: identity,
      __parseLiteral: parseLiteral
    }
}

function identity(value) {
  return value;
}

function parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT: {
        const value = Object.create(null);
        ast.fields.forEach(field => {
          value[field.name.value] = parseLiteral(field.value);
        });
        return value;
      }
      case Kind.LIST:
        return ast.values.map(parseLiteral);
      default:
        return null;
  }
}
