# How to run the test suite

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

The end-to-end testing suite uses [Cypress]((https://docs.cypress.io/guides/guides/command-line.html)) to drive and test user experience scenarios. It runs a separate test instance of Spoke, configured separately from the config in your `.env`, using the `spoke_test` PostgreSQL database, and running at `http://localhost:3001`.

To run the end-to-end suite in development:

1. Set up PostgreSQL as described above
2. Build assets with `NODE_ENV=test OUTPUT_DIR=./build ASSETS_DIR=./build/client/assets ASSETS_MAP_FILE=assets.json yarn prod-build`
3. Start test instance of Spoke with `yarn cypress-start`
4. Run end-to-end test suite interactively with `yarn test-cypress`

The end-to-end suite runs in CI using a Github Actions workflow defined in `.github/workflows/cypress-tests.yaml`.
