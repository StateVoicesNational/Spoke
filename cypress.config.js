const { defineConfig } = require('cypress')

module.exports = defineConfig({
  fixturesFolder: '__test__/cypress/fixtures',
  video: true,
  e2e: {
    setupNodeEvents(on, config) {
      return require('./__test__/cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:3001',
    specPattern: '__test__/cypress/integration/*.test.js',
    supportFile: '__test__/cypress/support/index.js',
  },
})
