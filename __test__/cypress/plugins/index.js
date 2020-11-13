// plugins run in the cypress Node process, not the browser. Define tasks
// operations like seeding the database that can't be run from the browser.
// See: https://on.cypress.io/plugins-guide
require("babel-register");
require("babel-polyfill");

if (process.env.DEFAULT_SERVICE !== "fakeservice") {
  console.log("Not using fakeservice, some tests will be disabled");
}

if (process.env.DB_TYPE !== "pg") {
  // Not supported because of a conflict between the sqlite and electron binaries
  // See: https://github.com/MoveOnOrg/Spoke/issues/1529#issuecomment-623680962
  throw Error(
    "Running Cypress tests against Sqlite is not currently supported"
  );
}

const makeTasks = require("./tasks").makeTasks;
const utils = require("./utils");

module.exports = async (on, config) => {
  if (!config.env.TEST_ORGANIZATION_ID) {
    const org = await utils.getOrCreateTestOrganization();
    config.env.TEST_ORGANIZATION_ID = org.id;
  }

  // TODO: use the API to determine what service is being used rather
  //   than relying on .env.
  config.env.DEFAULT_SERVICE = process.env.DEFAULT_SERVICE;
  on("task", makeTasks(config));

  return config;
};
