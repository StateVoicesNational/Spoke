import { mapFieldsToModel } from './lib/utils'
import { r, Organization } from '../models'
import { accessRequired, hasOsdiConfigured } from './errors'
import { buildCampaignQuery, getCampaigns } from './campaign'
import { buildUserOrganizationQuery } from './user'
import axios from 'axios'

export const resolvers = {
  Organization: {
    ...mapFieldsToModel([
      'id',
      'name'
    ], Organization),
    campaigns: async (organization, { cursor, campaignsFilter }, { user }) => {
      await accessRequired(user, organization.id, 'SUPERVOLUNTEER')
      return getCampaigns(organization.id, cursor, campaignsFilter)
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
    people: async (organization, { role, campaignId }, { user }) => {
      await accessRequired(user, organization.id, 'SUPERVOLUNTEER')
      return buildUserOrganizationQuery(r.knex.select('user.*'), organization.id, role, campaignId)
    },
    threeClickEnabled: (organization) => organization.features.indexOf('threeClick') !== -1,
    textingHoursEnforced: (organization) => organization.texting_hours_enforced,
    optOutMessage: (organization) => (organization.features && organization.features.indexOf('opt_out_message') !== -1 ? JSON.parse(organization.features).opt_out_message : process.env.OPT_OUT_MESSAGE) || 'I\'m opting you out of texts immediately. Have a great day.',
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
