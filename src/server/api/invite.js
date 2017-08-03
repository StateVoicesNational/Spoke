import { mapFieldsToModel } from './lib/utils'
import { Invite } from '../models'

export const schema = `
  type Invite {
    id: ID
    isValid: Boolean
    hash: String
  }
`

export const resolvers = {
  Invite: {
    ...mapFieldsToModel([
      'id',
      'isValid',
      'hash'
    ], Invite)
  }
}
