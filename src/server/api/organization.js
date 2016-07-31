import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired } from './errors'

export const schema = `
  type BillingDetails {
    creditAmount: Int
    creditCurrency: String
  }

  type Organization {
    id: ID
    name: String
    campaigns: [Campaign]
    texters: [User]
    admins: [User]
    optOuts: [OptOut]
    billingDetails: BillingDetails
  }
`

export const resolvers = {
  BillingDetails: {
    creditAmount: (organization) => organization.credit_amount || 0,
    creditCurrency: (organization) => organization.credit_currency || 'usd'
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

