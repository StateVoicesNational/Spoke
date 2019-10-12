require("dotenv").config();

// environment variables will be populated from above, and influence the knex-connect import
var config = require("./src/server/knex-connect");

module.exports = {
  development: config,
  test: config,
  staging: config,
  production: config
};
