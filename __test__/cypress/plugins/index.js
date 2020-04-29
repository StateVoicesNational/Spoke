// plugins run in the cypress Node process, not the browser. Define tasks
// operations like seeding the database that can't be run from the browser.
// See: https://on.cypress.io/plugins-guide
require("dotenv").load();
require("babel-register");
require("babel-polyfill");

const makeTasks = require("./tasks").makeTasks;
const utils = require("./utils");

module.exports = async (on, config) => {
  if (config.env.SUPPRESS_ORG_CREATION && !config.env.TEST_ORGANIZATION_ID) {
    throw new Error(
      "Missing TEST_ORGANIZATION_ID and org creation is disabled"
    );
  }
  if (!config.env.TEST_ORGANIZATION_ID) {
    config.env.TEST_ORGANIZATION_ID = await utils.getOrCreateTestOrganization();
  }

  on("task", makeTasks(config));
};
