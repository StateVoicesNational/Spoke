import { schema, resolvers } from '../src/server/api/schema';
import { graphql } from 'graphql';
import { User, r } from '../src/server/models/';
import { getContext, 
  thinkyTest, 
  testR, 
  setupTest, 
  cleanupTest, 
  testDB } from './test_helpers';
import { makeExecutableSchema } from 'graphql-tools';

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
  allowUndefinedInResolve: true,
});

const rootValue = {};

beforeEach(async () => await setupTest());

// afterEach(async () => await cleanupTest());

test('test database exists', async () => {
  const databaseList = await testR.dbList();
  return testDB in databaseList;
});

// graphQL tests!!!!

async function createUser() {
  const user = new User({
    auth0_id: 'test123',
    first_name: 'TestUserFirst',
    last_name: 'TestUserLast',
    cell: '555-555-5555',
    email: 'testuser@example.com',
  });
  try {
    await user.save();
    console.log("created user")
    console.log(user)
    return user
  } catch(err) {
    console.error('Error saving user');
    return false
  }
}

async function createInvite() {
  const inviteQuery = `mutation {
    createInvite(invite: {is_valid: true}) {
      id
    }
  }`;
  const context = getContext();
  try {
    const invite = await graphql(mySchema, inviteQuery, rootValue, context)
    return invite
  } catch(err) {
    console.error('Error creating invite')
    return false
  }
}

async function createOrganization(user, name, userId, inviteId) {
  const context = getContext({ user });

  const orgQuery = `mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
    createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
      id
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

async function createCampaign(user, title, description, organizationId) {
  const context = getContext({user});

  const campaignQuery = `mutation createCampaign($input: CampaignInput!) {
    createCampaign(campaign: $input) {
      id
      title
    }
  }`;
  const variables = {
    "input": {
        "title": title,
        "description": description,
        "organizationId": organizationId  
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

it('should be undefined when user not logged in', async () => {
  const query = `{
    currentUser {
      id
    }
  }`;
  const context = getContext();
  const result = await graphql(mySchema, query, rootValue, context)
  const data = result

  expect(typeof data.currentUser).toBeUndefined
});

it('should return the current user when user is logged in', async () => {
  const user = await createUser()
  const query = `{
    currentUser {
      email
    }
  }`;
  const context = getContext({ user })
  const result = await graphql(mySchema, query, rootValue, context)
  const { data } = result

  expect(data.currentUser.email).toBe('testuser@example.com')
});

// TESTING CAMPAIGN CREATION FROM END TO END

it('should create an invite', async () => {
  const invite = await createInvite()

  expect (invite.data.createInvite.id).toBeTruthy()
});

it('should convert an invitation and user into a valid organization instance', async () => {

  const [user, invite] = await Promise.all([createUser(), createInvite()])

  if (invite && user) {
    console.log("user and invite for org")
    console.log([user,invite.data])

    const userQuery = `{
      currentUser {
        id
      }
    }`;

    const org = await createOrganization(user, "Testy test organization", invite.data.createInvite.id, invite.data.createInvite.id)

    expect(org.data.createOrganization.name).toBe('Testy test organization')
  } else {
    console.log("Failed to create invite and/or user for organization test")
    return false
  }
});


it('should create a test campaign', async () => {

  const [user, invite] = await Promise.all([createUser(), createInvite()])
  const organizationTitle = "test org"
  const organization = await createOrganization(user, organizationTitle, user.id, invite.data.createInvite.id)

  const campaignTitle = "test campaign"
  const campaign = await createCampaign(user, campaignTitle, "test description", organization.data.createOrganization.id)
  expect (campaign.data.createCampaign.title).toBe(campaignTitle)

});


// it('should create campaign contacts', async () => {});

// it('should add texters to a organization', async () => {});

// it('should assign texters to campaign contacts', async () => {});

// it('should save a campaign script composed of interaction steps', async() => {});

// it('should save some canned responses for texters', async() => {});

// it('should start the campaign', async() => {});

// TEST STUBS: MESSAGING

// it('should send an inital message to test contacts', async() => {});


