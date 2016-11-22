import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired } from './errors'

export const schema = `
  type Organization {
    id: ID
    name: String
    campaigns(campaignsFilter: CampaignsFilter): [Campaign]
    people(role: String): [User]
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
  }
`

export const resolvers = {
  Organization: {
    ...mapFieldsToModel([
      'id',
      'name'
    ], Organization),
    campaigns: async (organization, { campaignsFilter }, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      let query = r.table('campaign').getAll(organization.id, { index:
        'organization_id' })

      if (campaignsFilter && campaignsFilter.hasOwnProperty('isArchived') && campaignsFilter.isArchived !== null) {
        query = query.filter({ is_archived: campaignsFilter.isArchived })
      }

      query = query.orderBy(r.desc('due_by'))

      return query
    },
    optOuts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return r.table('opt_out')
        .getAll(organization.id, { index: 'organization_id' })
    },
    people: async (organization, { role }, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')

      const roleFilter = role ? (userOrganization) => userOrganization('roles').contains(role) : {}
      return r.table('user_organization')
      .getAll(organization.id, { index: 'organization_id' })
      .filter(roleFilter)
      .eqJoin('user_id', r.table('user'))('right')
    },
    threeClickEnabled: (organization) => organization.features.indexOf('threeClick') !== -1,
    textingHoursEnforced: (organization) => organization.texting_hours_settings.is_enforced,
    textingHoursStart: (organization) => organization.texting_hours_settings.permitted_hours[0],
    textingHoursEnd: (organization) => organization.texting_hours_settings.permitted_hours[1]
  }
}

