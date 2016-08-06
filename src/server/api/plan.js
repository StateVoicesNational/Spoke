import { mapFieldsToModel } from './lib/utils'
import { Plan } from '../models'

export const schema = `
  type Plan {
    id: ID
    amountPerContact: Int
    currency: String
  }
`
export const resolvers = {
  Plan: {
    ...mapFieldsToModel([
      'id',
      'currency',
      'amountPerContact'
    ], Plan)
  }
}
