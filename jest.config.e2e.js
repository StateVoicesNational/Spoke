const _ = require('lodash')
const config = require('./jest.config')

const overrides = {
  setupTestFrameworkScriptFile: '<rootDir>/__test__/e2e/util/setup.js',
  testMatch: ['**/__test__/e2e/**/*.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/__test__/e2e/util/', '<rootDir>/__test__/e2e/pom/']
}
const merges = {
  globals: {
    BASE_URL: 'localhost:3000'
  }
}

module.exports = _
  .chain(config)
  .assign(overrides)
  .merge(merges)
  .value()
