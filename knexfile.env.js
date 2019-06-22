// Update with your config settings.
require('dotenv').config()
var config = require('./src/server/knex')

module.exports = {
  development: config,
  test: config,
  staging: config,
  production: config
};
