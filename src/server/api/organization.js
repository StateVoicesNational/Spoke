import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired } from './errors'
import { buildCampaignQuery } from './campaign'
import { buildUserOrganizationQuery } from './user'

export const resolvers = {
  Organization: {
    ...mapFieldsToModel([
      'id',
      'name'
    ], Organization),
    campaigns: async (organization, { campaignsFilter }, { user }) => {
      await accessRequired(user, organization.id, 'SUPERVOLUNTEER')

      let query = buildCampaignQuery(
        r.knex.select('*'),
        organization.id,
        campaignsFilter
      )
      query = query.orderBy('due_by', 'desc')
      let results = await query
      results = results.map(result => {
        // Convert unix timestamp to date/time format
        if (!isNaN(result.due_by)) {
          const unixTimestamp = result.due_by
          result.due_by = new Date(unixTimestamp)
        }
        return result
      })
      return results
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
      return buildUserOrganizationQuery(r.knex.select('user.*'), organization.id, role)
    },
    threeClickEnabled: (organization) => organization.features.indexOf('threeClick') !== -1,
    textingHoursEnforced: (organization) => organization.texting_hours_enforced,
    textingHoursStart: (organization) => organization.texting_hours_start,
    textingHoursEnd: (organization) => organization.texting_hours_end
  }
}
