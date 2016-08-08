import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired } from './errors'

export const schema = `
  type Organization {
    id: ID
    name: String
    campaigns: [Campaign]
    texters: [User]
    admins: [User]
    optOuts: [OptOut]
  }
`

export const resolvers = {
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
    }
  }
}

