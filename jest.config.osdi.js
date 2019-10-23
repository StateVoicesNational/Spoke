const _ = require('lodash')
const config = require('./jest.config')
require('dotenv').config({ path: '__test__/server/api/osdi.env' })

const overrides = {
  testMatch: ['**/__test__/server/api/osdi*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/__test__/e2e/'],
  bail: false, // To learn about errors sooner,
  verbose: false,
  //testURL: null
}
const merges = {
  // Merge in changes to deeper objects
  globals: {
    // This sets the BASE_URL for the target of the e2e tests (what the tests are testing)
    BASE_URL: 'spoke.loopback.site:3000',
    OSDI_SERVER_ENABLE: '1'
  }
}

module.exports = _
  .chain(config)
  .assign(overrides)
  .merge(merges)
  .value()
