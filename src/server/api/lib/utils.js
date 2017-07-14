import humps from 'humps'

export function mapFieldsToModel(fields, model) {
  const resolvers = {}

  fields.forEach((field) => {
    const snakeKey = humps.decamelize(field, { separator: '_' })
    // eslint-disable-next-line no-underscore-dangle
    if (model._schema._schema.hasOwnProperty(snakeKey)) {
      resolvers[field] = (instance) => instance[snakeKey]
    } else {
      // eslint-disable-next-line no-underscore-dangle
      throw new Error(`Could not find key ${snakeKey} in model ${model._schema._model._name}`)
    }
  })
  return resolvers
}
