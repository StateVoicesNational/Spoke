import { mapFieldsToModel } from './lib/utils'
import { Invite } from '../models'

export const schema = `
  type Invite {
    id: ID
    isValid: Boolean
  }
`

export const resolvers = {
  Invite: {
    ...mapFieldsToModel([
      'id',
      'isValid'
    ], Invite)
  }
}
