import _ from 'lodash'
import { createLoaders, createTables, dropTables, User, CampaignContact, r } from '../src/server/models/'
import { graphql } from 'graphql'

export async function setupTest() {
  await createTables()
  return
}

export async function cleanupTest() {
  await dropTables()
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders()
  }
}
import loadData from '../src/containers/hoc/load-data'
jest.mock('../src/containers/hoc/load-data')
/* Used to get graphql queries from components.
*  Because of some limitations with the jest require cache that
*  I can't find a way of getting around, it should only be called once
*  per test.

*  The query it returns will be that of the requested component, but
*  the mutations will be merged from the component and its children.
*/
export function getGql(componentPath, props) {
  require(componentPath) // eslint-disable-line

  const { mapQueriesToProps } = _.last(loadData.mock.calls)[1]

  const mutations = loadData.mock.calls.reduce((acc, mapping) => {
    if (!mapping[1].mapMutationsToProps) return acc
    return {
      ...acc,
      ..._.mapValues(
        mapping[1].mapMutationsToProps({ ownProps: props }),
        mutation => (...params) => {
          const m = mutation(...params)
          return [m.mutation.loc.source.body, m.variables]
        }
      )
    }
  }, {})

  let query
  if (mapQueriesToProps) {
    const data = mapQueriesToProps({ ownProps: props }).data
    query = [data.query.loc.source.body, data.variables]
  }

  return { query, mutations }
}

export async function createUser(
  userInfo = {
    auth0_id: 'test123',
    first_name: 'TestUserFirst',
    last_name: 'TestUserLast',
    cell: '555-555-5555',
    email: 'testuser@example.com'
  }
) {
  const user = new User(userInfo)
  await user.save()
  return user
}

export async function createContact(campaign) {
  const campaignId = campaign.id

  const contact = new CampaignContact({
    first_name: 'Ann',
    last_name: 'Lewis',
    cell: '5555555555',
    zip: '12345',
    campaign_id: campaignId
  })
  await contact.save()
  return contact
}


import { makeExecutableSchema } from 'graphql-tools'
import { resolvers } from '../src/server/api/schema'
import { schema } from '../src/api/schema'

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: true
})

const rootValue = {}

export async function runGql(query, vars, user) {
  const context = getContext({ user })
  return await graphql(mySchema, query, rootValue, context, vars)
}

export async function createInvite() {
  const inviteQuery = `mutation {
    createInvite(invite: {is_valid: true}) {
      id
    }
  }`
  const context = getContext()
  return await graphql(mySchema, inviteQuery, rootValue, context)
}

export async function createOrganization(user, invite) {
  const name = 'Testy test organization'
  const userId = user.id
  const inviteId = invite.data.createInvite.id

  const context = getContext({ user })

  const orgQuery = `mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
    createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
      id
      uuid
    }
  }`

  const variables = {
    userId,
    name,
    inviteId
  }
  return await graphql(mySchema, orgQuery, rootValue, context, variables)
}

export async function createCampaign(user, organization) {
  const title = 'test campaign'
  const description = 'test description'
  const organizationId = organization.data.createOrganization.id
  const contacts = []
  const context = getContext({ user })

  const campaignQuery = `mutation createCampaign($input: CampaignInput!) {
    createCampaign(campaign: $input) {
      id
    }
  }`
  const variables = {
    input: {
      title,
      description,
      organizationId,
      contacts
    }
  }
  const ret = await graphql(mySchema, campaignQuery, rootValue, context, variables)
  return ret.data.createCampaign
}

export async function createTexter(organization) {
  const user = await createUser({
    auth0_id: 'test456',
    first_name: 'TestTexterFirst',
    last_name: 'TestTexterLast',
    cell: '555-555-6666',
    email: 'testtexter@example.com'
  })
  const joinQuery = `
  mutation joinOrganization($organizationUuid: String!) {
    joinOrganization(organizationUuid: $organizationUuid) {
      id
    }
  }`
  const variables = {
    organizationUuid: organization.data.createOrganization.uuid
  }
  const context = getContext({ user })
  await graphql(mySchema, joinQuery, rootValue, context, variables)
  return user
}

export async function assignTexter(admin, user, campaign) {
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
    }
  }`
  const context = getContext({ user: admin })
  const updateCampaign = Object.assign({}, campaign)
  const campaignId = updateCampaign.id
  updateCampaign.texters = [
    {
      id: user.id
    }
  ]
  delete updateCampaign.id
  delete updateCampaign.contacts
  const variables = {
    campaignId,
    campaign: updateCampaign
  }
  return await graphql(mySchema, campaignEditQuery, rootValue, context, variables)
}

export async function createScript(admin, campaign) {
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
    }
  }`
  const context = getContext({ user: admin })
  const campaignId = campaign.id
  const variables = {
    campaignId,
    campaign: {
      interactionSteps: {
        id: '1',
        questionText: 'Test',
        script: '{zip}',
        answerOption: '',
        answerActions: '',
        parentInteractionId: null,
        isDeleted: false,
        interactionSteps: [
          {
            id: '2',
            questionText: 'hmm',
            script: '{lastName}',
            answerOption: 'hmm',
            answerActions: '',
            parentInteractionId: '1',
            isDeleted: false,
            interactionSteps: []
          }
        ]
      }
    }
  }
  return await graphql(mySchema, campaignEditQuery, rootValue, context, variables)
}


jest.mock('../src/server/mail')
export async function startCampaign(admin, campaign) {
  const startCampaignQuery = `mutation startCampaign($campaignId: String!) {
    startCampaign(id: $campaignId) {
      id
    }
  }`
  const context = getContext({ user: admin })
  const variables = { campaignId: campaign.id }
  return await graphql(mySchema, startCampaignQuery, rootValue, context, variables)
}

export async function getCampaignContact(id) {
  return await r
  .knex('campaign_contact')
  .where({ id })
  .first()
}
