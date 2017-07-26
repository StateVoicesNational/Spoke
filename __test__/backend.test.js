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

beforeEach(async () => await setupTest());

// afterEach(async () => await cleanupTest());

test('test database exists', async () => {
  const databaseList = await testR.dbList();
  return testDB in databaseList;
});

// graphQL tests!!!!

it('should be undefined when user not logged in', async () => {
  const query = `{
    currentUser {
      id
    }
  }`;
  const rootValue = {};
  const context = getContext();
  const result = await graphql(mySchema, query, rootValue, context);
  console.log(result)
  const data = result;
  expect(typeof data.currentUser).toBe('undefined')
});

it('should return the current user when user is logged in', async () => {
  const user = new User({
    auth0_id: 'test123',
    first_name: 'TestUserFirst',
    last_name: 'TestUserLast',
    cell: '555-555-5555',
    email: 'testuser@example.com',
  });
  await user.save();

  const query = `{
    currentUser {
      email
    }
  }`;
  const rootValue = {};
  const context = getContext({ user });

  const result = await graphql(mySchema, query, rootValue, context);
  console.log(result);
  const { data }  = result;

  expect(data.currentUser.email).toBe('testuser@example.com')
});


// TEST STUBS: CAMPAIGN CREATION

// it('should create an invite and return an invitation id', async () => {});

// it('should create an invite, create an organization with that invite, and return an organization instance', async () => {});

// it('should create an test campaign', async () => {});

// it('should create campaign contacts', async () => {});

// it('should add texters to a organization', async () => {});

// it('should assign texters to campaign contacts', async () => {});

// it('should save a campaign script composed of interaction steps', async() => {});

// it('should save some canned responses for texters', async() => {});

// it('should start the campaign', async() => {});

// TEST STUBS: MESSAGING

// it('should send an inital message to test contacts', async() => {});


