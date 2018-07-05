import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired, hasOsdiConfigured } from './errors'
import axios from 'axios'

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
    osdiLists(osdiListsFilter: OsdiListFilter): [OsdiList]
    osdiQuestions: [String]
    osdiEnabled: Boolean
    osdiApiToken: String
    osdiApiUrl: String
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
    osdiLists: async (organization, { osdiListFilter }, { user }) => {
      // This is probably not working, since I took it apart to write the osdiQuestions function
      await hasOsdiConfigured(organization)
      const {osdiApiUrl, osdiApiToken} = organization.features
      const client = await osdi.client(organization.features.osdiApiUrl)
      // const client = await osdi.client(organization.features.osdiApiUrl).set('OSDI-API-Token', organization.features.osdiApiToken)

      let lists = []
      let res = client.parse(await client.getLists())

      lists = lists.contact(res.lists)

      while (res.nextPage) {
        res = client.parse(await res.nextPage())
        lists = lists.contact(res.lists)
      }

      return lists
    },
    osdiQuestions: async (organization, args, context, info) => {
      // TODO pagination!
      await hasOsdiConfigured(organization)
      const { osdiApiUrl, osdiApiToken } = JSON.parse(organization.features)
      const client = axios.create({
        baseURL: osdiApiUrl,
        headers: { 'OSDI-Api-Token': osdiApiToken }
      })
      const { data } = await client.get('/questions')
      const questions = []
      data._embedded['osdi:questions'].forEach((q, i) => {
        const s = JSON.stringify(q)
        questions.push(s)
      })
      return questions
      // TODO figure out how to do async/await error handling
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
    textingHoursEnd: (organization) => organization.texting_hours_end,
    osdiEnabled: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN') // TODO should other users be able to
      return tryFeatureParse(organization, 'osdiEnabled', false)
    },
    osdiApiUrl: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return tryFeatureParse(organization, 'osdiApiUrl', '')
    },
    osdiApiToken: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, 'ADMIN')
      return tryFeatureParse(organization, 'osdiApiToken', '')
    }
  }
}

function tryFeatureParse(organization, key, backup) {
  try {
    const possible = JSON.parse(organization.features)[key]
    const result = possible !== undefined ? possible : backup
    return result
  } catch (ex) {
    return backup
  }
}
