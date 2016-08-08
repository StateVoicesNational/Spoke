import { mapFieldsToModel } from './lib/utils'
import { Plan } from '../models'

export const schema = `
  type Plan {
    id: ID
    amountPerMessage: Int
    currency: String
  }
`
export const resolvers = {
  Plan: {
    ...mapFieldsToModel([
      'id',
      'currency',
      'amountPerMessage'
    ], Plan)
  }
}
