import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired } from './errors'

export const schema = `
  type Organization {
    id: ID
    uuid: String
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
      await accessRequired(user, organization.id, 'SUPERVOLUNTEER')
      let query = r.table('campaign').getAll(organization.id, { index:
        'organization_id' })

      if (campaignsFilter && campaignsFilter.hasOwnProperty('isArchived') && campaignsFilter.isArchived !== null) {
        query = query.filter({ is_archived: campaignsFilter.isArchived })
      }
      if (campaignsFilter && campaignsFilter.hasOwnProperty('campaignId') && campaignsFilter.campaignId !== null) {
        query = query.filter({ id: parseInt(campaignsFilter.campaignId) })
      }

      query = query.orderBy(r.desc('due_by'))

      return query
    },
    uuid: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'SUPERVOLUNTEER')
      const result = await r.knex('organization')
        .column('uuid')
        .where('id', organization.id)
      return result[0].uuid
    },
    optOuts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return r.table('opt_out')
        .getAll(organization.id, { index: 'organization_id' })
    },
    people: async (organization, { role }, { user }) => {
      await accessRequired(user, organization.id, 'SUPERVOLUNTEER')

      const roleFilter = role ? { role } : {}

      return r.table('user_organization')
        .getAll(organization.id, { index: 'organization_id' })
        .filter(roleFilter)
        .eqJoin('user_id', r.table('user'))('right')
        .distinct()
    },
    threeClickEnabled: (organization) => organization.features.indexOf('threeClick') !== -1,
    textingHoursEnforced: (organization) => organization.texting_hours_enforced,
    textingHoursStart: (organization) => organization.texting_hours_start,
    textingHoursEnd: (organization) => organization.texting_hours_end
  }
}
