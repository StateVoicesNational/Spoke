require("@babel/register");
require("babel-polyfill");
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    specPattern: "__test__/cypress/integration/*",
    fixturesFolder: "__test__/cypress/fixtures",
    supportFile: "__test__/cypress/support/e2e.js",
    video: true,
    setupNodeEvents(on, config) {
      require("./__test__/cypress/plugins/tasks").defineTasks(on, config);
      // bind to the event we care about
    },
  },

  component: {
    supportFile: "__test__/cypress/support/component.js",
    indexHtmlFile: "__test__/cypress/support/component-index.html",
    specPattern: "src//**/*spec.{js,jsx,ts,tsx}",
    video: true,
    devServer: {
      framework: "create-react-app",
      bundler: "webpack",
    },
  },
});
