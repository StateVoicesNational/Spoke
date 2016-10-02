import { r } from '../server/models'
/*
1. First get the Heroku SSH key from saikat and add it to your .ssh directory as id_rsa_gearshift_admin
2. Start an SSH tunnel to production with:
ssh -f -N -i ~/.ssh/id_rsa_gearshift_admin -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes -L 127.0.0.1:28015:10.211.104.3:28015 -p 11236 compose@aws-us-east-1-portal.5.dblayer.com
3. Add in the production database credentials to .env.  This means copying over the values for DB_HOST, DB_PORT, DB_NAME and DB_KEY from heroku config and putting them into .env
4. Run this script with ./dev-tools/babel-run-with-env ./src/migrations/dummy-migration.js
5. Close the SSH tunnel with 'killall ssh'
6. Undo your .env changes
*/
(async function () {
  try {
    const count = await r.table('user').count()
    console.log(count)
  } catch (ex) {
    console.log(ex)
  }
})()
