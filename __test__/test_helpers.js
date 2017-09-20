import { createLoaders } from '../src/server/models/';

async function clearTestData() {
  // delete test.sqlite?
}

async function setupTest() {
  // await createTestDatabase();
  await clearTestData();
}

// customize 
async function cleanupTest() {
  await clearTestData();
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders(),
  };
}

export { setupTest, cleanupTest, getContext }

