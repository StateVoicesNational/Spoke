import { createLoaders, createTables, dropTables, r } from '../src/server/models/'
import { sleep } from '../src/workers/lib'

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
    loaders: createLoaders(),
  }
}

