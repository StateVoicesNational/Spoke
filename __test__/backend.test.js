// manually load the test db at the command line by running: 
// rethinkdb
// rethinkdb restore ./test_data/test_db.tar.gz

// delete the test database by running `r.dbDrop('test')` in the data explorer
// (http://localhost:8080)

// import { altSchema } from '../src/server/api/schema';
import { graphql } from 'graphql';
import { User, r } from '../src/server/models/';
import { getContext, thinkyTest, testR, setupTest } from './test_helpers';

const testDB = 'testy'

beforeEach(async () => await setupTest());

test('test database exists', async () => {
  const databaseList = await testR.dbList();
  return testDB in databaseList;
});

// These graphQL tests don't work yet: 

// it('should be null when user is not logged in', async () => {
//   // const query = `{
//   //   query Q {
//   //     currentUser {
//   //       id
//   //     }
//   //   }
//   // }`;
//   const query = `{
//     currentUser {
//       id
//     }
//   }`;
//   const rootValue = {};
//   // TODO: implement getContext();
//   const context = getContext();
//   const result = await graphql(altSchema, query, rootValue, context);
//   console.log(result);
//   const { data } = result;
//   expect(data.currentUser.id).toBe(null)
// });

// it('should return the current user when user is logged in', async () => {
//   const user = new User({
//     auth0_id: 'test123',
//     first_name: 'TestUserFirst',
//     last_name: 'TestUserLast',
//     cell: '555-555-5555',
//     email: 'testuser@example.com'
//   });
//   await user.save();

//   const query = `{
//     query Q {
//       currentUser {
//         email
//       }
//     }
//   }`;
//   const rootValue = {};
//   const context = getContext({ user });

//   const result = await graphql(schema, query, rootValue, context);
//   const { data } = result;

//   expect(data.currentUser.email).toBe('testuser@example.com')
// });


// testing valid graphql context






/// commented out to avoid creating a million test users

// it('should create a user in the test database only', async() => {
//   const user = new User({
//     auth0_id: 'test123',
//     first_name: 'TestUserFirst',
//     last_name: 'TestUserLast',
//     cell: '555-555-5555',
//     email: 'testuser2@example.com'
//   });
//   await user.save();
//   return true
// })

// it('should create a user in the spokedev database only', async() => {
//   await r.db('spokedev').table('user').insert({
//     auth0_id: 'test123',
//     first_name: 'TestUserFirst',
//     last_name: 'TestUserLast',
//     cell: '555-555-5555',
//     email: 'testuser3@example.com'
//   });  
//   return true
// })








