import { createLoaders } from '../src/server/models/';
import thinky from 'thinky';

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

async function createTestDatabase() {
  const dbList = await testR.dbList();
  if (dbList.indexOf(testDB) > -1) {
    console.log("Test database " + testDB + " already exists.");
  } else {
    await testR.dbCreate(testDB);
    await testR.db(mainDB).tableList().forEach(testR.db(testDB).tableCreate(testR.row));
    console.log("created test database " + testDB + " and populated with models from main database " + mainDB)
  }
}  

async function clearTestData() {
  const tableList = await testR.db(testDB).tableList();
  tableList.forEach(async function(tableName) {
    await testR.db(testDB).table(tableName).delete()
  });
  console.log('truncated test database tables')
}

async function setupTest() {
  // await createTestDatabase();
  await clearTestDatabase();
}

// customize 
async function cleanupTest() {
  await clearTestDatabase();
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders(),
  };
}

export { thinkyTest, testR, setupTest, cleanupTest, createTestDatabase, getContext }

