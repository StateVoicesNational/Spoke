import { schema, resolvers } from '../src/server/api/schema'
import { graphql } from 'graphql'
import { User, Organization, Campaign, CampaignContact, r } from '../src/server/models/'
import { sleep } from '../src/workers/lib'
import { resolvers as campaignResolvers } from '../src/server/api/campaign'
import { getContext,
  setupTest,
  cleanupTest } from './test_helpers'
import { makeExecutableSchema } from 'graphql-tools'

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
  allowUndefinedInResolve: true,
})

const rootValue = {}

// data items used across tests

let testAdminUser
let testInvite
let testOrganization
let testCampaign
let testTexterUser

// data creation functions

async function createUser(userInfo = {
  auth0_id: 'test123',
  first_name: 'TestUserFirst',
  last_name: 'TestUserLast',
  cell: '555-555-5555',
  email: 'testuser@example.com',
}) {
  const user = new User(userInfo)
  try {
    await user.save()
    console.log("created user")
    console.log(user)
    return user
  } catch(err) {
    console.error('Error saving user')
    return false
  }
}

async function createContact(campaignId) {
  const contact = new CampaignContact({
    first_name: "Ann",
    last_name: "Lewis",
    cell: "5555555555",
    zip: "12345",
    campaign_id: campaignId
  })
  try {
    await contact.save()
    console.log("created contact")
    console.log(contact)
    return contact
  } catch(err) {
    console.error('Error saving contact: ', err)
    return false
  }
}

async function createInvite() {
  const inviteQuery = `mutation {
    createInvite(invite: {is_valid: true}) {
      id
    }
  }`
  const context = getContext()
  try {
    const invite = await graphql(mySchema, inviteQuery, rootValue, context)
    return invite
  } catch(err) {
    console.error('Error creating invite')
    return false
  }
}

async function createOrganization(user, name, userId, inviteId) {
  const context = getContext({ user })

  const orgQuery = `mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
    createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
      id
      uuid
      name
      threeClickEnabled
      textingHoursEnforced
      textingHoursStart
      textingHoursEnd
    }
  }`

  const variables = {
    "userId": userId,
    "name": name,
    "inviteId": inviteId
  }

  try {
    const org = await graphql(mySchema, orgQuery, rootValue, context, variables)
    return org
  } catch(err) {
    console.error('Error creating organization')
    return false
  }
}

async function createCampaign(user, title, description, organizationId, contacts = []) {
  const context = getContext({user})

  const campaignQuery = `mutation createCampaign($input: CampaignInput!) {
    createCampaign(campaign: $input) {
      id
      title
      contacts {
        firstName
        lastName
      }
    }
  }`
  const variables = {
    "input": {
        "title": title,
        "description": description,
        "organizationId": organizationId,
        "contacts": contacts
    }
  }

  try {
    const campaign = await graphql(mySchema, campaignQuery, rootValue, context, variables)
    return campaign
  } catch(err) {
    console.error('Error creating campaign')
    return false
  }
}

// graphQL tests

beforeAll(async () => {
  let testDbExists = false
  while (!testDbExists) {
    testDbExists = await r.knex.schema.hasTable('job_request')
    if (!testDbExists) {
      const waitUntilDbCreated = await sleep(1000)
    }
  }
})

afterAll(async () => await cleanupTest())

it('should be undefined when user not logged in', async () => {
  const query = `{
    currentUser {
      id
    }
  }`
  const context = getContext()
  const result = await graphql(mySchema, query, rootValue, context)
  const data = result

  expect(typeof data.currentUser).toBeUndefined
})

it('should return the current user when user is logged in', async () => {
  testAdminUser = await createUser()
  const query = `{
    currentUser {
      email
    }
  }`
  const context = getContext({ user: testAdminUser })
  const result = await graphql(mySchema, query, rootValue, context)
  const { data } = result

  expect(data.currentUser.email).toBe('testuser@example.com')
})

// TESTING CAMPAIGN CREATION FROM END TO END

it('should create an invite', async () => {
  testInvite = await createInvite()

  expect(testInvite.data.createInvite.id).toBeTruthy()
})

it('should convert an invitation and user into a valid organization instance', async () => {

  if (testInvite && testAdminUser) {
    console.log("user and invite for org")
    console.log([testAdminUser,testInvite.data])

    testOrganization = await createOrganization(testAdminUser, "Testy test organization", testInvite.data.createInvite.id, testInvite.data.createInvite.id)

    expect(testOrganization.data.createOrganization.name).toBe('Testy test organization')
  } else {
    console.log("Failed to create invite and/or user for organization test")
    return false
  }
})


it('should create a test campaign', async () => {
  const campaignTitle = "test campaign"
  testCampaign = await createCampaign(testAdminUser, campaignTitle, "test description", testOrganization.data.createOrganization.id)

  expect(testCampaign.data.createCampaign.title).toBe(campaignTitle)
})

it('should create campaign contacts', async () => {
  const contact = await createContact(testCampaign.data.createCampaign.id)
  expect(contact.campaign_id).toBe(parseInt(testCampaign.data.createCampaign.id))
})

it('should add texters to a organization', async () => {
  testTexterUser = await createUser({
    auth0_id: 'test456',
    first_name: 'TestTexterFirst',
    last_name: 'TestTexterLast',
    cell: '555-555-6666',
    email: 'testtexter@example.com',
  })
  const joinQuery = `
  mutation joinOrganization($organizationUuid: String!) {
    joinOrganization(organizationUuid: $organizationUuid) {
      id
    }
  }`
  const variables = {
    organizationUuid: testOrganization.data.createOrganization.uuid
  }
  const context = getContext({user: testTexterUser})
  const result = await graphql(mySchema, joinQuery, rootValue, context, variables)
  expect(result.data.joinOrganization.id).toBeTruthy()
})

it('should assign texters to campaign contacts', async () => {
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
      title
      description
      dueBy
      isStarted
      isArchived
      contactsCount
      datawarehouseAvailable
      customFields
      texters {
        id
        firstName
        assignment(campaignId:$campaignId) {
          contactsCount
          needsMessageCount: contactsCount(contactsFilter:{messageStatus:\"needsMessage\"})
        }
      }
      interactionSteps {
        id
        script
        question {
          text
          answerOptions {
            value
            action
            nextInteractionStep {
              id
            }
          }
        }
      }
      cannedResponses {
        id
        title
        text
      }
    }
  }`
  const context = getContext({user: testAdminUser})
  const updateCampaign = Object.assign({}, testCampaign.data.createCampaign)
  const campaignId = updateCampaign.id
  updateCampaign.texters = [{
    id: testTexterUser.id
  }]
  delete(updateCampaign.id)
  delete(updateCampaign.contacts)
  const variables = {
    campaignId: campaignId,
    campaign: updateCampaign
  }
  const result = await graphql(mySchema, campaignEditQuery, rootValue, context, variables)
  expect(result.data.editCampaign.texters.length).toBe(1)
  expect(result.data.editCampaign.texters[0].assignment.contactsCount).toBe(1)
})

// it('should save a campaign script composed of interaction steps', async() => {})

// it('should save some canned responses for texters', async() => {})

// it('should start the campaign', async() => {})

// TEST STUBS: MESSAGING

// it('should send an inital message to test contacts', async() => {})

describe('Campaign', () => {
  let organization
  let campaigns
  let contacts

  beforeEach(async () => {
    organization = await (new Organization({
      name: 'organization',
      texting_hours_start: 0,
      texting_hours_end: 0
    })).save()

    campaigns = await Promise.all([
      new Campaign({
        organization_id: organization.id,
        is_started: false,
        is_archived: false,
        due_by: new Date()
      }),
      new Campaign({
        organization_id: organization.id,
        is_started: false,
        is_archived: false,
        due_by: new Date()
      })
    ].map(async (each) => (
      each.save()
    )))

    contacts = await Promise.all([
      new CampaignContact({campaign_id: campaigns[0].id, cell: '', message_status: 'closed'}),
      new CampaignContact({campaign_id: campaigns[1].id, cell: '', message_status: 'closed'})
    ].map(async (each) => (
      each.save()
    )))
  })

  test('resolves contacts', async () => {
    const results = await campaignResolvers.Campaign.contacts(campaigns[0])
    expect(results).toHaveLength(1)
    expect(results[0].campaign_id).toEqual(campaigns[0].id)
  })

  test('resolves contacts count', async () => {
    const results = await campaignResolvers.Campaign.contactsCount(campaigns[0])
    expect(results).toEqual(1)
  })

  test('resolves contacts count when empty', async () => {
    const campaign = await (new Campaign({
      organization_id: organization.id,
      is_started: false,
      is_archived: false,
      due_by: new Date()
    })).save()
    const results = await campaignResolvers.Campaign.contactsCount(campaign)
    expect(results).toEqual(0)
  })
})
