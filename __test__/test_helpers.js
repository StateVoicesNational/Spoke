import { createLoaders } from '../src/server/models/';
import thinky from 'thinky';

// create test database manually by running 
// rethinkdb && ./dev-tools/babel-run-with-env.js ./dev-tools/db-startup.js
// but with database name set to 'test'

// TODO: Load these values from env for real

const testDB = 'testy'
const mainDB = 'spokedev'

const thinkyTest = thinky({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  db: testDB,
  authKey: process.env.DB_KEY
});

const testR = thinkyTest.r

async function populateTestDatabaseModels() {
  console.log("mainDB: " + mainDB)
  console.log("testDB: " + testDB)
  await testR.db(mainDB).tableList().forEach(testR.db(testDB).tableCreate(testR.row));
}

async function clearTestDatabase() {
  const tableList = await testR.db(testDB).tableList();
  tableList.forEach(async function(tableName) {
    await testR.db(testDB).table(tableName).delete()
  });
}

async function setupTest() {
  // await populateTestDatabaseModels();
  await clearTestDatabase();
}

// This doesn't work yet
export function getContext(context) {
  return {
    ...context, 
    req: {},
    loaders: createLoaders(),
  };
}

export { thinkyTest, testR, setupTest, getContext }

