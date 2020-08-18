## Deploying Minimally

There are several ways to deploy. This is the 'most minimal' approach:

1. Run `OUTPUT_DIR=./build yarn run prod-build-server`
   This will generate something you can deploy to production in ./build and run nodejs server/server/index.js
2. Run `yarn run prod-build-client`
3. Make a copy of `deploy/spoke-pm2.config.js.template`, e.g. `spoke-pm2.config.js`, add missing environment variables, and run it with [pm2](https://www.npmjs.com/package/pm2), e.g. `pm2 start spoke-pm2.config.js --env production`
4. [Install PostgreSQL](https://wiki.postgresql.org/wiki/Detailed_installation_guides)
5. Start PostgreSQL (e.g. `sudo /etc/init.d/postgresql start`), connect (e.g. `sudo -u postgres psql`), create a user and database (e.g. `create user spoke password 'spoke'; create database spoke owner spoke;`), disconnect (e.g. `\q`) and add credentials to `DB_` variables in spoke-pm2.config.js
