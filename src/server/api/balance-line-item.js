import { mapFieldsToModel } from './lib/utils'
import { BalanceLineItem, r } from '../models'

export const schema = `
  type BalanceLineItemPayment {
    externalId: String
    method: String
  }
  type BalanceLineItem {
    id: String
    amount: Int
    currency: String
    createdAt: Date,
    source: String,
    payment: BalanceLineItemPayment
  }
`

export const resolvers = {
  BalanceLineItemPayment: {
    externalId: (balanceLineItem) => balanceLineItem.payment_id,
    method: (balanceLineItem) => balanceLineItem.payment_method
  },
  BalanceLineItem: {
    ...mapFieldsToModel([
      'id',
      'amount',
      'currency',
      'source',
      'createdAt'
    ], BalanceLineItem),
    payment: (balanceLineItem) => balanceLineItem
  },
}
