import { graphql } from 'graphql'
import { Assignment, Campaign, CampaignContact, Organization, User } from '../../src/server/models/index'
import { resolvers as campaignResolvers } from '../../src/server/api/campaign'
import { cleanupTest, setupTest } from '../test_helpers'
import {
  createCampaign,
  createContact,
  createInvite,
  createOrganization,
  createUser,
  getContext,
  makeExecutableSchema
} from './test_helpers'

const rootValue = {}

// data items used across tests

const mySchema = makeExecutableSchema()

let testAdminUser
let testInvite
let testOrganization
let testCampaign
let testTexterUser

beforeAll(async () => await setupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)
afterAll(async () => await cleanupTest(), global.DATABASE_SETUP_TEARDOWN_TIMEOUT)


describe('graphQL tests', async () => {

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
    const context = getContext({user: testAdminUser})
    const result = await graphql(mySchema, query, rootValue, context)
    const {data} = result

    expect(data.currentUser.email).toBe('testuser@example.com')
  })

// TESTING CAMPAIGN CREATION FROM END TO END

  it('should create an invite', async () => {
    testInvite = await createInvite()

    expect(testInvite.data.createInvite).toBeDefined()
    expect(testInvite.data.createInvite.id).toBeTruthy()
  })

  it('should convert an invitation and user into a valid organization instance', async () => {

    if (testInvite && testAdminUser) {
      console.log("user and invite for org")
      console.log([testAdminUser, testInvite.data])

      testOrganization = await createOrganization(testAdminUser, "Testy test organization", testInvite.data.createInvite.id, testInvite.data.createInvite.id)

      expect(testOrganization.data.createOrganization.id).toBeDefined()
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
        questionText
        script
        answerOption
        answerActions
        parentInteractionId
        isDeleted
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

})

// it('should save a campaign script composed of interaction steps', async() => {})

// it('should save some canned responses for texters', async() => {})

// it('should start the campaign', async() => {})

// TEST STUBS: MESSAGING

// it('should send an inital message to test contacts', async() => {})

describe('Campaign', () => {
  let organization

  beforeEach(async () => {
    organization = await (new Organization({
      name: 'organization',
      texting_hours_start: 0,
      texting_hours_end: 0
    })).save()
  })

  describe('contacts', async () => {
    let campaigns
    let contacts

    beforeEach(async () => {
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

  describe('unassigned contacts', () => {
    let campaign

    beforeEach(async () => {
      campaign = await (new Campaign({
        organization_id: organization.id,
        is_started: false,
        is_archived: false,
        due_by: new Date()
      })).save()
    })

    test('resolves unassigned contacts when true', async () => {
      const contact = await (new CampaignContact({
        campaign_id: campaign.id,
        message_status: 'closed',
        cell: '',
      })).save()

      const results = await campaignResolvers.Campaign.hasUnassignedContacts(campaign)
      expect(results).toEqual(true)
    })

    test('resolves unassigned contacts when false with assigned contacts', async () => {
      const user = await (new User({
        auth0_id: 'test123',
        first_name: 'TestUserFirst',
        last_name: 'TestUserLast',
        cell: '555-555-5555',
        email: 'testuser@example.com',
      })).save()

      const assignment = await (new Assignment({
        user_id: user.id,
        campaign_id: campaign.id,
      })).save()

      const contact = await (new CampaignContact({
        campaign_id: campaign.id,
        assignment_id: assignment.id,
        message_status: 'closed',
        cell: '',
      })).save()

      const results = await campaignResolvers.Campaign.hasUnassignedContacts(campaign)
      expect(results).toEqual(false)
    })

    test('resolves unassigned contacts when false with no contacts', async () => {
      const results = await campaignResolvers.Campaign.hasUnassignedContacts(campaign)
      expect(results).toEqual(false)
    })
  })
})
