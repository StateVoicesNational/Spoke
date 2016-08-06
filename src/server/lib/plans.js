import { r } from '../models'

const PLAN_DEFAULTS = {
  usd: {
    amountPerContact: 10
  }
}

export const SUPPORTED_CURRENCIES = ['usd']

export const getDefaultPlanAttributes = (currency) => ({
  currency,
  ...PLAN_DEFAULTS[currency]
})

export const getDefaultPlan = async(currency) => (
  await r.table('plan')
    .filter(getDefaultPlanAttributes(currency))
    .limit(1)(0)
)
