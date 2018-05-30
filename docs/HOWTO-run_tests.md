There are current two ways to run tests, using either PostgreSQL or SQLite.

## PostgreSQL Testing (default, closer to most prod environments)

1) Install PostgreSQL
2) In PostgreSQL, create a database and user named "spoke_test":
```
CREATE DATABASE spoke_test;
CREATE USER spoke_test WITH PASSWORD 'spoke_test';
GRANT ALL PRIVILEGES ON DATABASE spoke_test TO spoke_test;
```
3) Run `npm test`

## SQLite Testing (simpler)

1) Run `npm run test-sqlite`
