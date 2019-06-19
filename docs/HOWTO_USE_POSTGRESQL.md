# How to set up Spoke with Postgresql

To use Postgresql, follow these steps:

1. In `.env` set `DB_TYPE=pg`. (Otherwise, you will use sqlite.)
2. Set `DB_PORT=5432`, which is the default port for Postgres.
3. Create the spokedev database:  `psql -c "create database spokedev;"`

That's all you need to do initially. The tables will be created the first time the app runs.