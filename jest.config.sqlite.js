module.exports = require('./jest.config')
module.exports.globals.DB_JSON = JSON.stringify({
  client: "sqlite3",
  connection: {filename:"./test.sqlite"},
  defaultsUnsupported: true
})
