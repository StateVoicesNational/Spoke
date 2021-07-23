# Instructions for one click deployment to Heroku

- Create a Heroku account (if you don't have an account). For more questions on Heroku and what it does, please visit [here](https://www.heroku.com/what)
- The form you fill out in Heroku has a lot of values. These are configuration values (also known as environment variables). Each value is essentially a setting. Some are necessary for deployment and others customize the experience in your instance of Spoke. For more questions about configuration values in this application visit [our documentation on environment variables and what they do](REFERENCE-environment_variables.md). For more questions in general about configuration variables in Heroku, visit [Heroku's config variable explanation page](https://devcenter.heroku.com/articles/config-vars)
- Do not start any of the processes/dynos besides `web` (see below for non-Twilio uses)
- The default setup is a free tier for processing and the database. See below for scaling and production requirements

## Important Note for First Time Deployers:

- There is a variable named `SUPPRESS_SELF_INVITE` in your configuration variables in Heroku. When this is set to nothing, anyone can visit your app and create an organization. When it is set to `true`, this changes login/signup behavior - when a person signs up and visits your app, they will not create an organization. On first deployment, it should be set to nothing to ensure that you have the ability to create an organization and view the full functionality of the application.

## Instructions for Auth0 configuration variable setup

- Follow the instructions at [Auth0 for authentication](HOWTO-configure-auth0.md)
  - Where the instructions mention `yourspoke.example.com`, replace it with `<YOUR SPOKE APP>.herokuapp.com` (or in production, possibly the domain you aliased to it in your DNS config)



## Notes about SMS and Twilio configuration variable setup

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary. You can also include "autorespond" in the script message text, and an automatic reply will be generated (just for `fakeservice`!)

**Twilio**

Twilio provides [test credentials](https://www.twilio.com/docs/iam/test-credentials) that will not charge your account as described in their documentation. 

If you need to use Twilio in development but with live keys, click [here](HOWTO_INTEGRATE_TWILIO.md) for instructions.
When using instructions, please remember that references to NGROK urls should change to your Heroku app url.

Visit [here](https://www.twilio.com/docs/api/messaging/services-and-copilot) to configure messaging service features

## Setting up for production scale (Database, etc)

The default deployment from the Heroku button is free, but has a processing and database limit of 10,000 messages total.
This may be sufficient for a single small campaign, but if you intend multiple/regular campaigns, we recommend upgrading
the database and possibly the `web` 'dyno' instance (to [Hobby or Standard](https://devcenter.heroku.com/articles/dynos)). At the time of this writing a ['hobby basic' level for the database is ~\$9.00/month](https://devcenter.heroku.com/articles/heroku-postgres-plans#plan-tiers).

For production scale, the best time to upgrade the database is after you have completed basic setup at the Hobby database level (created a first user account, the Owner role, and logged in through the admin UI, then created the Organization, set SUPPRESS_SELF_INVITE to `true` after creating the Organization, and perhaps created and ran a small first live test Campaign) and before you start using the app for live real Campaigns, because the easiest path erases all
previous data. If you have existing data, please refer to Heroku docs on [how to upgrade a database](https://devcenter.heroku.com/articles/upgrading-heroku-postgres-databases) (it's complicated). After you have upgraded a Heroku Postgres database plan from the Hobby level to, say, a Standard level Heroku Postgres database, you _must_ enable the `PGSSLMODE=require` config var/env variable. Please be sure to read [our documentation on environment variables and what they do](REFERENCE-environment_variables.md) now :) .

If you have not used the app, after you've created the instance (filled out the variables, and 'deployed' it)
follow these steps:

1. Go to the 'Resources' tab for your app and scroll to the bottom
2. Under 'Add-ons' to the right end of the "Heroku Postgres::Database" line, click the little up-down carrot
3. Choose 'Remove' and follow the procedure for removal
4. Then, in the 'Add-ons' search box (where it says 'Quickly add add-ons from Elements'), type "postgres"
5. Choose the "Heroku Postgres" option and then choose the tier you desire (see Heroku Postgres tier documentation for details)
6. At the very top of the page for your app, in the upper right click the 'More' button and choose 'Restart all dynos'

## Non-Twilio Processes/Dynos

When using Twilio we recommend keeping the configuration variable `JOBS_SAME_PROCESS` enabled and only running the `web` process/dyno.
There is another mode mostly for non-Twilio backends, where you may need to run the additional processes to process messages and sending. Most times, even at high scale, you will want to keep `JOBS_SAME_PROCESS` on and increase or upgrade the dynos for the `web` process.

## Email configuration

See [this guide](HOWTO_EMAIL_CONFIGURATION.md) for instructions.

## Data exporting

In order to export data from campaigns (such as contacts' responses to questions), you need to configure S3 or Bucketeer. See [this guide](HOWTO_DATA_EXPORTING.md) for instructions.

## Upgrading an existing Heroku app

There are two ways to do this, the first way will use the Heroku web dashboard and the second will use the terminal.
**Regardless of which method you choose, you should not deploy a version of Spoke without reading the [release notes](https://github.com/MoveOnOrg/Spoke/blob/main/docs/RELEASE_NOTES.md) in case there are any steps listed in "Deploy Steps" for that release**
Some releases require database maintenance in order to work properly.

**Method 1: The Dashboard Deploy Menu**
Visit your [Heroku App Dashboard](https://dashboard.heroku.com/apps) and click on Spoke. Once there, select the "Deploy" menu near "Overview." This is the section of your Heroku dasboard that controls how and when you deploy your app.

In the "Deploy" screen you should see a section titled "Deployment method" if you scroll down a bit. Inside of that there is an option to connect to github. You'll want to search for the repo there and connect it.

Once connected, you can scroll to the section titled "Manual deploy." From here, any time that click the "Deploy Branch" button, you will deploy the latest code from whatever branch you set.

**Method 2: Heroku CLI**
Spoke now runs on the Heroku [container stack](https://devcenter.heroku.com/categories/deploying-with-docker). Before updating an existing instance of Spoke, the target application needs to be [configured to use this stack](https://devcenter.heroku.com/articles/stack#migrating-to-a-new-stack) if it is not already.

To update to the `container` stack, run:

```cli
heroku stack:set container --app myspokeapp
```

Then push to heroku from the branch that you wish to deploy:

```cli
git remote add heroku https://git.heroku.com/myspokeapp.git
git push heroku master
```

You may find that the Customize Log In toggle in auth0 has been disabled, so you will want to turn that back on. You will also want to make sure you are running the latest version of the code for that. See the instructions in Step 11 in the main readme doc.

### Migrating the Database

For smaller instances with a single dyno, Spoke will automatically
update the database with schema changes when you update the code.
Even for smaller instances, it's generally good practice to pause the
system or at least do so during minimal/zero texting activity.

For large instances (100K-millions of texts and contacts) or extensive
schema changes, it's better to be cautious during a migration. In
those cases, you should follow the following steps:

1. Pause all of the dynos or disable web requests coming in, in another way.

2. Run (yes it looks a bit redundant)

```
   heroku run npm run knex migrate:latest
```

3. Ideally, verify that the migrations have completed on the database.
   Then re-enable the dynos and web interface.
