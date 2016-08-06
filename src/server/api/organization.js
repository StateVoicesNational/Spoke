import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired } from './errors'
import stripe from 'stripe'

export const schema = `
  type CreditCard {
    expMonth: String
    last4: String
    expYear: String
    brand: String
  }
  type BillingDetails {
    balanceAmount: Int
    creditCurrency: String
    creditCard: CreditCard
  }

  type Organization {
    id: ID
    name: String
    campaigns: [Campaign]
    texters: [User]
    admins: [User]
    optOuts: [OptOut]
    billingDetails: BillingDetails
    plan: Plan
  }
`

export const resolvers = {
  CreditCard: {
    expMonth: (card) => card.exp_month,
    expYear: (card) => card.exp_year,
    last4: (card) => card.last4,
    brand: (card) => card.brand
  },
  BillingDetails: {
    balanceAmount: (organization) => organization.balance_amount || 0,
    creditCurrency: (organization) => organization.currency,
    creditCard: async (organization) => {
      if (!organization.stripe_id)
        return null
      else {
        const stripeAPI = stripe(process.env.STRIPE_SECRET_KEY)
        const result = await stripeAPI.customers.retrieve(organization.stripe_id, {
          expand: ['default_source']
        })
        return result.default_source
      }
    }
  },
  Organization: {
    ...mapFieldsToModel([
      'id',
      'name'
    ], Organization),
    campaigns: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return r.table('campaign').getAll(organization.id, { index:
        'organization_id' })
    },
    optOuts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return r.table('campaign')
        .getAll(organization.id, { index: 'organization_id' })
        .merge((campaign) => ({
          assignments: r.table('assignment')
            .getAll(campaign('id'), { index: 'campaign_id' })
            .coerceTo('array')
            .merge((assignment) => ({
              optOuts: r.table('opt_out')
                .getAll(assignment('id'), { index: 'assignment_id' })
                .coerceTo('array')
            }))
        }))
        .concatMap((ele) => ele('assignments'))
        .concatMap((ele) => ele('optOuts'))
    },
    plan: async (organization, _, { loaders }) => {
      //FIXME
      if (organization.plan_id) {
        return await loaders.plan.load(organization.plan_id)
      } else {
        return await r.table('plan').filter({}).limit(1)(0)
        // return await getDefaultPlan('usd')
      }
    },
    texters: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return r.table('user_organization')
      .getAll(organization.id, { index: 'organization_id' })
      .filter((userOrganization) => userOrganization('roles').contains('TEXTER'))
      .eqJoin('user_id', r.table('user'))('right')
    },
    admins: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return r.table('user_organization')
      .getAll(organization.id, { index: 'organization_id' })
      .filter((userOrganization) => userOrganization('roles').contains('ADMIN'))
      .eqJoin('user_id', r.table('user'))('right')
    },
    billingDetails: (organization) => organization
  }
}

