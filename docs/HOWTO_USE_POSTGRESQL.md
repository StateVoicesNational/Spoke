# How to set up Spoke with Postgresql

To use Postgresql, follow these steps:

1. Either install docker (recommended) or postgresql on your machine:
   * If you installed docker run the database using: `docker-compose up`
   * If you installed postgres locally, create the spoke dev database: `psql -c "create database spokedev;"`
1. In `.env` set `DB_TYPE=pg`. (Otherwise, you will use sqlite.)
2. Set `DB_PORT=5432`, which is the default port for Postgres.

That's all you need to do initially. The tables will be created the first time the app runs.
