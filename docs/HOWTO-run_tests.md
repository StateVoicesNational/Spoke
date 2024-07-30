# How to run the test suite

There are current two ways to run tests, using either PostgreSQL or SQLite.

## PostgreSQL Testing (default, closer to most prod environments)

### Running Postgres with Docker (recommended)

1. Install [Docker](https://docs.docker.com/desktop/)
2. Run redis and postgres using docker compose: `docker compose up`
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

## Integration Testing

The integration test suite automates real world user scenarios to verify that Spoke behaves as intended. The integration testing suite uses [Cypress]((https://docs.cypress.io/guides/guides/command-line.html)) to drive a web browser to test user experience scenarios. It runs a separate test instance of Spoke, configured separately from the config in your `.env`, using the `spoke_test` PostgreSQL database, and running at `http://localhost:3001`.

To run the integration test suite in development:

1. Set up PostgreSQL as described above
3. Start test instance of Spoke with `yarn start:test`
4. Run integration test suite interactively with `yarn test-cypress`

The integration suite runs in CI using a Github Actions workflow defined in `.github/workflows/cypress-tests.yaml`.

When developing new features for Spoke, please consider writing a Cypress tests. The test server will hot reload your code changes so that you can test drive your feature development.