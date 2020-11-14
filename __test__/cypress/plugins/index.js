// plugins run in the cypress Node process, not the browser. Define tasks
// operations like seeding the database that can't be run from the browser.
// See: https://on.cypress.io/plugins-guide
require("babel-register");
require("babel-polyfill");

if (process.env.DEFAULT_SERVICE !== "fakeservice") {
  throw "Integration tests require DEFAULT_SERVICE=fakesevice";
}

if (process.env.DB_TYPE !== "pg") {
  // Not supported because of a conflict between the sqlite and electron binaries
  // See: https://github.com/MoveOnOrg/Spoke/issues/1529#issuecomment-623680962
  throw "Running Cypress tests against Sqlite is not currently supported";
}

const makeTasks = require("./tasks").makeTasks;

module.exports = async (on, config) => {
  makeTasks(on, config);

  return config;
};
