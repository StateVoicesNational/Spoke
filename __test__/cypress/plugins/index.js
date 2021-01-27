// plugins run in the cypress Node process, not the browser. Define tasks
// operations like seeding the database that can't be run from the browser.
// See: https://on.cypress.io/plugins-guide
require("babel-register");
require("babel-polyfill");

if (process.env.DEFAULT_SERVICE !== "fakeservice") {
  throw "Integration tests require DEFAULT_SERVICE=fakesevice";
}

// PostgreSQL required because of a conflict between the sqlite and electron binaries
// See: https://github.com/MoveOnOrg/Spoke/issues/1529#issuecomment-623680962
if (process.env.DB_TYPE !== "pg") {
  throw "Running Cypress tests against Sqlite is not currently supported";
}

module.exports = require("./tasks").defineTasks;
