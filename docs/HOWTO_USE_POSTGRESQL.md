# How to set up Spoke with Postgresql

To use Postgresql, follow these steps:

1. Either install docker (recommended) or postgresql on your machine:
   * If you installed docker run the database using: `docker-compose up`
   * If you installed postgres locally (or if you already have a local installation of postgres), create the spoke dev database: `psql -c "create database spokedev;"`
     * Then create a spoke user to connect to the database with `psql -d spokedev -c "create user spoke with password 'spoke';"` (to match the credentials in the .env.example file)
     * Grant permissions to the new Spoke user:
       * `psql -d spokedev -c "GRANT ALL PRIVILEGES ON DATABASE spokedev TO spoke;"`
       * `psql -d spokedev -c "GRANT ALL PRIVILEGES ON schema public TO spoke;"`
     * Create a test database by running the following commands:
       ```
       psql -d spokedev
       CREATE DATABASE spoke_test;
       CREATE USER spoke_test WITH PASSWORD 'spoke_test';
       GRANT ALL PRIVILEGES ON DATABASE spoke_test TO spoke_test;
       ```
1. In `.env` set `DB_TYPE=pg`. (Otherwise, you will use sqlite.)
2. Set `DB_PORT=5432`, which is the default port for Postgres.

That's all you need to do initially. The tables will be created the first time the app runs.
