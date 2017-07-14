import { r } from '../server/models'
import { log } from '../lib'

/*
1. First get the Heroku SSH key from Heroku and add it to your .ssh directory as id_rsa_gearshift_admin. This is the key under the config variable: 'SSH_TUNNEL_KEY'.  Copy and paste this into a file called ~/.ssh/id_rsa_gearshift_admin.  Remove the 'RSA:' part at the beginning.  Then, at the top of the file, add '-----BEGIN RSA PRIVATE KEY-----' and at the bottom add '-----END RSA PRIVATE KEY-----'.  Then run chmod 500 ~/.ssh/id_rsa_gearshift_admin
2. Start an SSH tunnel to production
3. Add in the production database credentials to .env.  This means copying over the values for DB_HOST, DB_PORT, DB_NAME and DB_KEY from heroku config and putting them into .env
4. Run this script with ./dev-tools/babel-run-with-env.js ./src/migrations/dummy-migration.js
5. Close the SSH tunnel with 'killall ssh'
6. Undo your .env changes
*/
(async function () {
  try {
    const count = await r.table('user').count()
  } catch (ex) {
    log.error(ex)
  }
})()
