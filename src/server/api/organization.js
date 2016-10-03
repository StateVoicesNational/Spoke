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
    balanceCredits: [BalanceLineItem]
  }

  type Organization {
    id: ID
    name: String
    campaigns(campaignsFilter: CampaignsFilter): [Campaign]
    people(role: String): [User]
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
    creditCard: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'OWNER')
      if (!organization.stripe_id) {
        return null
      } else {
        const stripeAPI = stripe(process.env.STRIPE_SECRET_KEY)
        const result = await stripeAPI.customers.retrieve(organization.stripe_id, {
          expand: ['default_source']
        })
        return result.default_source
      }
    },
    balanceCredits: async (organization) => r.table('balance_line_item')
      .getAll(organization.id, { index: 'organization_id' })
      .filter((doc) => doc('amount').gt(0))
      .orderBy('created_at')
  },
  Organization: {
    ...mapFieldsToModel([
      'id',
      'name'
    ], Organization),
    campaigns: async (organization, { campaignsFilter }, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      let query = r.table('campaign').getAll(organization.id, { index:
        'organization_id' })

      // if (campaignsFilter && campaignsFilter.hasOwnProperty('isArchived') && campaignsFilter.isArchived !== null) {
      //   query = query.filter({ is_archived: campaignsFilter.isArchived })
      // }

      return query
    },
    optOuts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return r.table('opt_out')
        .getAll(organization.id, { index: 'organization_id' })
    },
    plan: async (organization, _, { loaders }) => await loaders.plan.load(organization.plan_id),
    people: async (organization, { role }, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')

      const roleFilter = role ? (userOrganization) => userOrganization('roles').contains(role) : {}
      return r.table('user_organization')
      .getAll(organization.id, { index: 'organization_id' })
      .filter(roleFilter)
      .eqJoin('user_id', r.table('user'))('right')
    },
    billingDetails: (organization) => organization,
    threeClickEnabled: (organization) => organization.features.indexOf('threeClick') !== -1,
  }
}

