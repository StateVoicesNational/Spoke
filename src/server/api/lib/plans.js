import { Plan, r } from '../../models'

const PLAN_DEFAULTS = {
  'usd': {
    amountPerContact: 10
  }

export SUPPORTED_CURRENCIES = ['usd']

export getDefaultPlanAttributes = async (currency) => ({
  currency,
  ...PLAN_DEFAULTS[currency]
})

export getDefaultPlan = async(currency) => (
  r.table('plan')
    .filter(getDefaultPlanAttributes(currency))
    .limit(1)
    (0)
)
