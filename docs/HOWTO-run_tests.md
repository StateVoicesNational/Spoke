There are current two ways to run tests, using either PostgreSQL or SQLite.

## PostgreSQL Testing (default, closer to most prod environments)

### Running Postgres with Docker (recommended)

1. Install [Docker](https://docs.docker.com/desktop/)
2. Run redis and postgres using docker-compose: `docker-compose up`
3. Create the test database: `./dev-tools/create-test-database`
4. Run `yarn test`
 
### Installing Postgres locally
1) Install PostgreSQL - [Tips to installing Postgres](https://www.codementor.io/engineerapart/getting-started-with-postgresql-on-mac-osx-are8jcopb)
2) In PostgreSQL, create a database and user named "spoke_test":
```
CREATE DATABASE spoke_test;
CREATE USER spoke_test WITH PASSWORD 'spoke_test';
GRANT ALL PRIVILEGES ON DATABASE spoke_test TO spoke_test;
```
3) Run `yarn test`

## SQLite Testing (simpler)

1) Run `yarn run test-sqlite`

## Test Redis Cache

Redis is used for caching and is separate from the backend DB so can be used with sqlite *or* postgres. Redis cache testing defaults to postgres and functions like an 'addon' to the DB for improved speed/scalability.

1) Run `yarn test-rediscache`

## End-To-End Testing

1. Run your local development environment with DEFAULT_SERVICE=fakeservice.
2. Run `yarn run cypress open` for the interactive test runner. For non-interactive
   run `yarn run cypress run --browser <browser>`.

See [the Cypress documentation](https://docs.cypress.io/guides/guides/command-line.html) for more info.
