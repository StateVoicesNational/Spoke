import { schema, resolvers } from '../src/server/api/schema';
import { graphql } from 'graphql';
import { User, r } from '../src/server/models/';
import { getContext, thinkyTest, testR, setupTest } from './test_helpers';
import { makeExecutableSchema } from 'graphql-tools';

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
  allowUndefinedInResolve: true,
});

const testDB = 'testy'

beforeEach(async () => await setupTest());

test('test database exists', async () => {
  const databaseList = await testR.dbList();
  return testDB in databaseList;
});

// graphQL tests!!!!

it('should be undefined when user is not logged in', async () => {
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
  const data = result;

  expect(data.currentUser.email).toBe('testuser@example.com')
});

// moar tests: create invite, create organization with invite id

// it('should create an invite and return an invitation id', async () => {});

// it('should create an invite, create an organization with that invite, and return an organization instance', async () => {});



// }
