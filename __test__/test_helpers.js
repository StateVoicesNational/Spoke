const config = require('../knexfile.js')
const knex = require('knex')(config)
import { createLoaders } from '../src/server/models/'

//import {createLoaders, r} from '../src/server/models/'
//import { sleep } from '../src/workers/lib'

export async function setupTest() {
  await knex.migrate.latest()
}

export async function cleanupTest() {
  knex.destroy()
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders(),
  }
}

