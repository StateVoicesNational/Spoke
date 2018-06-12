const _ = require('lodash')
let config = require('./jest.config')
const overrides = {
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  testMatch: ["**/__test__/e2e/**/*.js"]
}
module.exports = _.extend(config, overrides)
