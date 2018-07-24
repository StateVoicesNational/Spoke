import { mapFieldsToModel } from './lib/utils'
import { Invite } from '../models'

export const resolvers = {
  Invite: {
    ...mapFieldsToModel([
      'id',
      'isValid',
      'hash'
    ], Invite)
  }
}
