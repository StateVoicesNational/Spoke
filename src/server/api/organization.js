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
    threeClickEnabled: Boolean
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
      return r.table('opt_out')
        .getAll(organization.id, { index: 'organization_id' })
    },
    plan: async (organization, _, { loaders }) => await loaders.plan.load(organization.plan_id),
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
    billingDetails: (organization) => organization,
    threeClickEnabled: (organization) => organization.features.indexOf('threeClick') !== -1
  }
}

