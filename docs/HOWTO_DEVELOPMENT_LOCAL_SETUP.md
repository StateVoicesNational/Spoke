## Getting started

---
### [Repository](https://github.com/MoveOnOrg/Spoke)
1. If you have not already, Fork this repo then clone your forked copy. Then future pull requests can be made from your repo to Spoke. 
```
git clone <url of your forked repo>
```

2. change your pwd (present working directory) to the spoke directory before installations 
```
cd spoke
```

3. You may use this opportunity to set the remote upstream to spoke's repo for future fetches.
```
git remote add upstream https://github.com/MoveOnOrg/Spoke.git
``` 
   -  you can check that this is configured correctly to push to the origin and fetch from spoke's repo. 
   ```
   git remote -v
   ```
   Your origin and Upstream should appear configured correctly.
   - this is a good time to take a look at [Syncing a Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) for full understanding.

---
### Downloading

1. Install the Node version listed in `.nvmrc`. [NVM](https://github.com/creationix/nvm) is one way to do this (from the spoke directory):
   ```
   nvm install 12
   nvm use 12
   ```
   - this assumes you have nvm (node version manager) installed.  If not, either
   * run 
   ```
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
   ```
   * or visit [NVM INTRO](https://github.com/nvm-sh/nvm/blob/master/README.md) for a better understanding.
   - at this time of this writing, nvm install will install a version above 17 but we want to run 12 and then yarn will have to be installed again, even if you use yarn already. 
    
2. Install yarn.

- Yarn is a package manager that will download all required packages to run Spoke.
- Install using the [directions provided by Yarn](https://yarnpkg.com/en/docs/install).

3. Install the packages.
   ```
   yarn install
   ```
4. Create a real environment file:
   ```
   cp .env.example .env
   ```

- This creates a copy of `.env.example`, but renames it `.env` so the system will use it. _Make sure you use this new file._

---
### Your `.env` file

We use environment variables to allow instance admins to customize their Spoke experience. If you end up doing dev work on an area that is configured through environment variables, it will be helpful to be familiar with the patterns used. Because of this, we recommend that you take a look at the [environment variable reference](REFERENCE-environment_variables.md) to get a lay of the land.  

---
### Your Database

We have 2 recommended ways to set up your database for your development environment and you can choose either based on your preference or comfort level. You can use sqlite (which is the default DB so you can proceed to the next section if you choose this) or postgres. At this time, all production Spoke instances use postgres.

If you're using postgres (see below), you should set `DB_TYPE=pg` and if you're using sqlite, you don't need to change anything about your .env file.


#### Using Docker to run postgres (optional)

Docker is optional, but can help with a consistent development environment using postgres. You can also ([set up postgres without docker](HOWTO_USE_POSTGRESQL.md)) but we recommend the docker route.

1. Install docker and docker compose

- Docker allows you to run apps in containers and can be installed [here with Docker's instructions](https://docs.docker.com/desktop/)
- Docker Compose is the tool used to create and run docker configurations. If you installed Docker on Mac, you already have Docker Compose, if you're using Linux or Windows you can install Docker Compose [with these instructions](https://docs.docker.com/compose/install/)

2. Make sure Docker is running on your machine and then build and run Spoke with `docker-compose up -d` to run redis and postgres in the background
   - You can stop docker compose at any time with `docker-compose down`, and data will persist next time you run `docker-compose up`.

3. Run `./dev-tools/create-test-database` to populate the test database

4. When done testing, clean up resources with `docker-compose down`, or `docker-compose down -v` to **_completely destroy_** your Postgres database & Redis datastore volumes.

### Getting the app running

At this point, you should be ready to start your app in development mode.

1. Run `yarn dev` to create and populate the tables.
   - Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
2. Go to `http://localhost:3000` to load the app. (Note: the terminal will say it's running on port 8090 -- don't believe it :-)
3. As long as you leave `SUPPRESS_SELF_INVITE=` blank in your `.env` you should be able to invite yourself from the homepage by signing up with your information. (Notice the URL address in your window has an invite page parameter for the next route)
   - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run:
     ```
     echo "INSERT INTO invite (hash,is_valid) VALUES ('E4502B28-301E-4E63-9A97-ACA14E8160C8', 1);" |sqlite3 mydb.sqlite
     # Note: When doing this with PostgreSQL, you would replace the `1` with `true`
     ```
   - Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/E4502B28-301E-4E63-9A97-ACA14E8160C8. This should redirect you to the login screen. Use the "Sign Up" option to create your account.
4. You should then be prompted to create an organization. Create it.
5. Once you've created your organization, we recommend setting the env var `SUPPRESS_SELF_INVITE=1` so you don't get prompted to create a new org every time you log in
6. See the [Admin](https://youtu.be/PTMykMX8gII) and [Texter](https://youtu.be/EqE1UDvKGco) demos to learn about how Spoke works.
7. See [the development guidelines](EXPLANATION-development-guidelines.md)
8. See [How to Run Tests](HOWTO-run_tests.md)

### SMS and Twilio in development

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary. You can also include "autorespond" in the script message text, and an automatic reply will be generated (just for `fakeservice`!)

If you need to use Twilio in development but with live keys, click [here](HOWTO_INTEGRATE_TWILIO.md) for instructions.
When using instructions, please remember that references to NGROK urls should change to your Heroku app url.
