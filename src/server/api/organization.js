import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired } from './errors'

export const schema = `
  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(campaignsFilter: CampaignsFilter): [Campaign]
    people(role: String, campaignsFilter: CampaignsFilter): [User]
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
        query = query.filter({ id: parseInt(campaignsFilter.campaignId)})
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
    people: async (organization, { role, campaignsFilter }, { user }) => {
      await accessRequired(user, organization.id, 'SUPERVOLUNTEER')

      const roleFilter = role ? { role } : {}

      let query = r.knex.select('user.*')
        .from('user_organization')
        .innerJoin('user', 'user_organization.user_id', 'user.id')
        .where(roleFilter)
        .where({'user_organization.organization_id':organization.id})
        .distinct()

      if (campaignsFilter && ('isArchived' in campaignsFilter || 'campaignId' in campaignsFilter)) {
        query = query
          .innerJoin('assignment', 'assignment.user_id', 'user_organization.user_id')
          .innerJoin('campaign', 'assignment.campaign_id', 'campaign.id')

        if ('isArchived' in campaignsFilter) {
          query = query.where({ 'campaign.is_archived': campaignsFilter.isArchived })
        }

        if ('campaignId' in campaignsFilter) {
          query = query.where({ 'campaign.id': parseInt(campaignsFilter.campaignId, 10) })

        }
      }

      return query
    },
    threeClickEnabled: (organization) => organization.features.indexOf('threeClick') !== -1,
    textingHoursEnforced: (organization) => organization.texting_hours_enforced,
    textingHoursStart: (organization) => organization.texting_hours_start,
    textingHoursEnd: (organization) => organization.texting_hours_end
  }
}
