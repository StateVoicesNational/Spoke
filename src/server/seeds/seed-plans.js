import { Plan, r } from '../models'
import { SUPPORTED_CURRENCIES, getDefaultAttributes } from '../lib/plans'

export async function seedPlans() {
  const count = SUPPORTED_CURRENCIES.length
  for (let i = 0; i < count; i++) {
    const currency = SUPPORTED_CURRENCIES[i]
    const hasPlan = (await r.table('plan')
      .filter(getDefaultAttributes(currency))
      .limit(1)
      .count()) > 0

    if (!hasPlan) {
      await Plan.save(getDefaultAttributes(currency))
    }
  }
}
