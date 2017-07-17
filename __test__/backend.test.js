// first load the test db at the command line by running 
// rethinkdb
// rethinkdb restore test_db.tar.gz

// delete the test database by running `r.dbDrop('test')` in the data explorer
// (http://localhost:8080)

import { r } from '../src/server/models'
// const backend = require('./backend');

test('test database exists', async () => {
  const databaseList = await r.dbList();
  return 'test' in databaseList;
});

