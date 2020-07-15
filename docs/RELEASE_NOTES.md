# Release Notes


## v7.1

_July 2020:_ Release 7.1 is a testament to the community working together -- several organizations using Spoke contributed features along with several open-source progressive volunteers (several as their first contribution)!  Thank you to all who contributed.  At the top in "Significant for deployments" there are top-lines for what to know before or during upgrade.  As usual, please let us know if you have any issues.

### Significant for deployments:

* After changing the texter send keyboard shortcut to Ctrl-X we have moved it (again) to Ctrl-Enter (to avoid conflict with OS 'cut' shortcuts)
* There is a small migration to the user table which needs to be run before/during migration (either by leaving/disabling SUPPRESS_MIGRATIONS="" or for [AWS Lambda, see the db migration instructions](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DEPLOYING_AWS_LAMBDA.md#migrating-the-database)
* If you are running on lambda, you might consider setting JOB_RUNNER="lambda-async" for better scaling/performance

### New Features
* Suspending texters: marking a texter Suspended in the People page immediately stops them from being able to text - @JeremyParker
* Zapier action handler support for triggering when contact tags are updated - @lperson (enable with adding `zapier-action` in your ACTION_HANDLERS env var)
* Extra Profile Fields -- by setting an organization features variable in the database, additional profile fields can be added during signup, which can be required even for existing users to complete. - @jeffm2001
* [Slack Authentication](./HOWTO_INTEGRATE_SLACK_AUTH.md) (alternative to Auth0 or local)  - @matteosb
* Tag data in campaign export files - @jeffm2001
* DataWarehouse contact loader bugfixes (actually works now) - @jeffm2001
* Edit canned responses (you used to just be able to add/remove -- now you can edit) - @aschneit
* Reduced 'flash' while sending initial text messages -- now the Send button just blinks instead of the whole screen for reduced visual strain - @eamouzou
* Character and segment counts in the Script Editor - @hiemanshu
* Timezone sorting on the Campaign Admin List - @alliejones
* "Needs Response" count on Campaign Admin List, when [Redis is configured](./HOWTO_CONNECT_WITH_REDIS.md) - @schuyler1d
* Improved NGP VAN cell selection from lists - @lperson
* More experimental message-handler extensions: "auto-optout" allows automatic optout based on certain text coming in from a contact. and "profanity-tagger" gains an option to block a message on-send based on content. - @schuyler1d
* An exciting new "dispatch" framework to send jobs and tasks asynchronously for tracking which can differ by framework -- especially supporting AWS Lambda, but there is also an experimental "bull" implementation using Redis that we may want to default on Heroku deployments.  Please tell us of your experience here.  This should resolve a large number of bugs and improve performance in many places. - @matteosb
* Documenting Progressive Hacknight - @ibrand

### Bugs fixed
* weird [Object object] when tabbing into canned response text issue - @eamouzou
* simplified docker-compose file - @matteosb
* fix action handler select menu in Campaign Admin Interactions section - @matteosb

### Appreciations

Thanks to [alliejones](https://github/alliejones), [aschneit](https://github/aschneit), [eamouzou](https://github/eamouzou), [hiemanshu](https://github/hiemanshu), [ibrand](https://github/ibrand), [jeffm2001](https://github/jeffm2001), [JeremyParker](https://github/JeremyParker), [lperson](https://github/lperson), [matteosb](https://github/matteosb), and [schuyler1d](https://github/schuyler1d).

Also to AFL-CIO, MoveOn, NYCET, Scale to Win, and Working Families Party for sending their contributions and giving early feedback/debugging time.

### Coming up

In our next release, we're hoping to have even more VAN support in message handlers, some timezone config flexibility, some changes and features related to the recent FCC court decision, and hopefully a new dynamic assignment model. -- of course, along with a whole lot more -- send us your changes now, so we can bring it in to the next version!


## v7.0
_June 2020:_ Version 7.0 (or 6.19 in honor of Juneteenth!)
**Note:** This is a major release and therefore requires a schema change. See the deploy steps section for details. Anything marked as *experimental* has not yet been tested on a production texting campaign.
We're marking this as a major version update: 7.0 because there are several backwards-incompatible changes that we believe are important and valuable.

### Backwards incompatibilities:

* This change has schema changes on the `campaign` table which you should make sure to update -- it should be a fast and painless upgrade (automatic if you have it setup). See the deploy steps section for details of how to migrate.
* There are many Texter UI accessibility improvements, but they do come at the expense of changing how the Enter key behaves for texters.  You should communicate this to your texting team and update and training materials. (to revert this functionality, you can enable the env var HOLD_ENTER_KEY=1)
* SuperVolunteer roles now have access to all MessageReview operations.

### Improvements

* There is now further support for VAN -- a robust action handler that can be enabled by adding `ACTION_HANDLERS=ngpvan-action` to your environment variables will enable this.
* We have a new framework for extending the Texter UI interface called ["sideboxes"](https://github.com/MoveOnOrg/Spoke/issues/1533).  Enabled with environment variable TEXTER_SIDEBOXES which works similarly to action handlers, where it should be a comma separated list of enabled sideboxes. Developers can add sidebox functionality, and admins can set defaults in the organization Settings section and changes per-campaign -- enabling/disabling sideboxes.  Two so-far are:
  * `contact-reference` which is a link the texter can click and/or share with an admin for direct access to that conversation later
  * `tag-contact` which if you have EXPERIMENTAL_TAGS=1 enabled and create tags, a texter will have an interface to mark them.  They can then be filtered for in Message Review.

  There will be more work here going forward -- feedback is welcome as this is still a feature in active development.

* There is _another_ new experimental framework: Message Handlers which can intercept a message pre and post-save with a sample message handler that can tag profanity -- you can experiment with this by setting `MESSAGE_HANDLERS=profanity-tagger`
* Texter UI Accessibility improvements -- previously we captured the Enter key to send a message. This was inaccessible because the Enter key is used when navigating with the keyboard in order to 'click' a button. Sending is now possible with `Ctrl-x` (and skip is `Ctrl-y`).
* We have now disabled by default the ability to hold down the Enter key -- for sending you can now press any letter key (or Enter) to send a message. If you want this functionality back set HOLD_ENTER_KEY=1
* There is now a campaign 'sending errors' report which summarizes how many sending errors have been reported by Twilio.  Carrier Violation error messages are especially useful (and important) to track.
* A new contact-loader that allows upload into S3 to make larger uploads possible if you have deployed on AWS.
* A new environment or organization.features variable MAX_TEXTERS_PER_CAMPAIGN which can block more texters from joining a campaign with dynamic assignment.

### Bug fixes

There are too many bug fixes to mention -- [please see the full list of linked changes](https://github.com/MoveOnOrg/Spoke/pull/1623)

### Deploy Steps:
Instructions for migrating you database

* Make sure SUPPRESS_MIGRATIONS="" (not 0!) in your environment
* If you're using AWS Lambda, check out the [deploy instructions here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DEPLOYING_AWS_LAMBDA.md#migrating-the-database)

### Appreciations!

Thanks to all the contributors part of this release including: @ibrand @lperson @matteosb @schuyler1d

Also special shout outs to [Working Families Party](https://workingfamilies.org/) and [Movement For Black Lives](https://m4bl.org/) for staging some of these changes and giving feedback (along with MoveOn, too) -- Thank you to the Spoke teams there that drove great campaigns while providing technical bug reports so we could make this a better release :heart:

### Onward

Our next release, we're expecting some more great features -- ability to suspend texters, improving the dynamic assignment workflow, and more improvements around tags.  Devs and orgs, please send your PRs in now, so we can test your work out and get it in the next release.


## v6.1
_June 2020:_ Version 6.1

6.1 is mostly focused on technical improvements. We upgraded to the 2.x versions of apollo-client and react-apollo and removed the dependency on redux. This allowed us to fix some long-standing bugs and should improve the developer experience for Spoke contributors.

**Improvements**
* Data loading errors are displayed to the user rather than causing blank screens or infinite loading animations
* Enhanced the action handler framework with better error handling and caching to improve performance, and added the ability for administrators to optionally select extra information on a per-question-response basis to be sent to the remote system when a texter selects the response.

**Changes**
* Removed the threeClickEnabled organization feature

**Bug fixes**
* Resolved numerous issues related to cache collisions in the Apollo store
* Job progress updates more reliably on the campaign creation screen
* Fixed select all on the campaign archive screen
* Closing the user edit modal now takes you back to the person list
* Fixed an issue that allowed campaigns to start before all jobs completed

Thanks to all the contributors part of this release including:
[ibrand](https://github.com/ibrand),
[lperson](https://github.com/lperson),
[matteosb](https://github.com/matteosb),
[schuyler1d](https://github.com/schuyler1d)

## v6.0
_May 2020:_ Version 6.0
**Note:** This is a major release and therefore requires a schema change. See the deploy steps section for details. Anything marked as *experimental* has not yet been tested on a production texting campaign.
We're marking this as a major version update: 6.0 because there are several backwards-incompatible changes that we think you will love:

- *Experimental* Phone number inventory management -- Adds functionality to buy Twilio phone numbers directly through the Admin interface. Organizations using their own Messaging Service, i.e. those that have TWILIO_MESSAGE_SERVICE set in organization features rather than through the global env var, can add the numbers directly to their Messaging Service and use them for texting. Additionally, phone numbers purchased through Spoke can be configured to use a custom voice response by setting the TWILIO_VOICE_URL setting. A typical use case would be to use TwiML Bins to re-route calls or to play a custom voicemails. To configure:
  - Set EXPERIMENTAL_PHONE_INVENTORY to enable the feature
  - Set TWILIO_VOICE_URL for a custom voice response
- *Experimental* Per-campaign Twilio Messaging Services -- This feature lays the foundation for scaling Spoke on Twilio by allowing campaigns to use their own Messaging Services. When enabled, the campaign edit screen will allow admins to either supply a Messaging Service for the campaign to use or to have Spoke create one for them. Note that numbers will have to be added to the Messaging Service manually. This feature will be integrated with the phone number inventory in a future release. To configure:
  - Set EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE to enable
  - Set TWILIO_BASE_CALLBACK_URL to configure webhooks for Messaging Services created by Spoke. Required if this feature is enabled.
- New Texting UI -- in version 5.6 it was enableable with EXPERIMENTAL_TEXTERUI ahead of time. It is now the default! For this version, we allow you to preserve the old texter UI by setting the environment variable DEPRECATED_TEXTERUI=GONE_SOON. Also note that with the new UI we have removed user-created Canned Responses -- there's consensus that it causes more problems than it helps. We've also long had the Super Volunteer role which most campaigns use for a group of texters that can update canned responses when needed.
  - As part of this Texter UI, you can create [shortcut buttons](./REFERENCE-shortcut-rules.md) that will surface some of your question responses and canned responses as a row of buttons outside of a menu to speed up a texter's response flow. [Check out the docs to learn more!](./REFERENCE-shortcut-rules.md)
- Action Handler developers: Through the great work of @lperson for improved VAN support, our action handler api used to return a true/false value for the available() call -- it should now return an object with two keys: { result: <boolean on available>, expiresSeconds: <how long to cache the result, 0 by default>}
There are several schema changes -- only adding fields, so migration should be easy/fast. However, if you have SUPPRESS_MIGRATIONS enabled, then you will need to manually migrate the database ( Heroku, AWS Lambda )

In addition to those changes, we've improved the Admin People page (@lperson ) and made some tweaks to the Campaign Edit page (@matteosb , @higgyCodes ), and the Texter Todo list (@larkinds ).

Deploy Steps:

**Instructions for migrating you database**

1. Make sure SUPPRESS_MIGRATIONS="" (not 0!) in your environment
2. If you're using AWS Lambda, check out the [deploy instructions here](DEPLOYING_AWS_LAMBDA.md#migrating-the-database)

Thanks to all the contributors part of this release including:
[hiemanshu](https://github.com/hiemanshu),
[higgyCodes](https://github.com/higgyCodes),
[JeremyParker](https://github.com/JeremyParker),
[larkinds](https://github.com/larkinds),
[lperson](https://github.com/lperson),
[matteosb](https://github.com/matteosb),
[schuyler1d](https://github.com/schuyler1d)

## v5.5
_May 2020:_ Version 5.5
- Campaign List Admin changes (@lperson, @schuyler1d)
- Twilio Auth per organization (@jeffm2001 ) -- Now if you enable TWILIO_MULTI_ORG environment variable, each organization can use a different Twilio account that they can setup in the Settings Admin tab. This also allows per-organization message services. There is more work coming to allow [message services per-campaign](https://github.com/MoveOnOrg/Spoke/issues/1495) and [in-app phone number management](https://github.com/MoveOnOrg/Spoke/issues/1518)
- This release has several developing features -- you might say it's a 'preview' release of things to come. You can turn on these features with environment variables
  - EXPERIMENTAL_TEXTERUI: After some amazing design work by @arena with multiple iterations and two user testing rounds by @ibrand, We are planning to make this the DEFAULT texter interface in the next Spoke release. We know that this has some challenges for current deployments -- updating documentation and training materials for texters. Just like you switch ON this new version in this release, for one release (and no more), we intend that you will be able to set a different environment variable in order to keep the old interface. That should allow you to control the switch to the new interface gracefully.
    - We put a lot of work into this interface to accomodate upcoming features, radically improve the mobile (and generally cross-screen support) and address some issues that regularly come up for texters.
    - Please send your experience reports in testing
    - More context can be seen at [RFC: New Texter UI](https://github.com/MoveOnOrg/Spoke/pull/1522)
  - EXPERIMENTAL_TAGS: Tagging users instead of just saving question responses is a very common request, and we have a great volunteer team developing these features. This first step is creating an admin interface to create the tags. There will be more to come, but you can preview and test this development by enabling the environment variable. Thanks to @aschneit and @filafb!

(a cypress stub was also merged into main for e2e tests recently)

Thanks to all the contributors part of this release including:
[aschneit](https://github.com/aschneit),
[filafb](https://github.com/filafb),
[jasmosez](https://github.com/jasmosez),
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[tmc](https://github.com/tmc)

## v5.4
_April 2020:_ Version 5.4
This release includes the following improvements:

- *Experimental* A new contact loader for loading contacts in straight from NGP VAN (not yet tested on a production campaign)
- Scaling improvements
- Allow contact loaders to be toggled on a per-organization level
- Improvements to the contact loaders framework
- Upgrades node version to 10.x and twilio
- Account view has a more streamlined UI
- Various bug fixes


Thanks to all the contributors part of this release including:
[aschneit](https://github.com/aschneit),
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[ibrand](https://github.com/ibrand),

## v5.3
_March 2020:_ Version 5.3
This release includes the following improvements:

- Allow texters to send messages using an alias. If there is no alias for that texter, the message will include texter's first name when the interactions is `{ texterAliasOrFirstName }`
- Scaling improvements
- Add organization as an argument to getConfig so config can come from `organization.features` json column OR global context
- Refactor AssignmentTexterContact to create new demo screens for the texter UI in prep for a texter UI redesign and to help with training
- Reduces memory and write pressure in the database through removing superfluous indexes from campaign-contact
- Adds functionality to the Contact Loaders ingest framework for persistence and some api/integration use-cases
- New component tests
- Server change to allow admins to opt out any contact, even those not assigned to them.
- Fix send button alignment

Thanks to all the contributors part of this release including:
[filafb](https://github.com/filab),
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[ibrand](https://github.com/ibrand),
[rahatarmanahmed](https://github.com/rahatarmanahmed)

## v5.2
_February 2020:_ Version 5.2
This release includes the following improvements:

- Allow a user to specify multiple campaigns in message review
- Adds `addServerEndpoint` to make ingest loaders fully work
- Creates a local `.prettierrc` file so that our styles are consistent in new PRs
- Retries sending Twilio messages with error_code < 0 5 times

Thanks to all the contributors part of this release including:
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[ibrand](https://github.com/ibrand)

## v5.1
_February 2020:_ Version 5.1
This release includes the following improvements:

- Accepts and correctly handles contacts csv files with first_name instead of firstName and last_name instead of lastName for their respective column headers
- Creates a new [contact loader ingest framework](./HOWTO-use-contact-loaders.md) allowing for new methods of importing and ingesting contacts to be implemented.
- Re-enables the sqlite test suite and fixes errors surfaced by doing so
- Bug fixes around switching from Auth0 to local auth
- Fixes the spelling of "Optouts" to Opt-outs in admin dashboard nav

Thanks to all the contributors part of this release including:
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[ibrand](https://github.com/ibrand),
[dannytatom](https://github.com/dannytatom)

## v5.0
_January 2020:_ Version 5.0
**Note:** This is a major release and therefore requires a schema change. See the deploy steps section for details.

This release includes the following improvements:

- Upgrades react-formal, which gets rid of browser-console warnings related to prop-types
- Fixes a bug for interaction step selection in safari
- Fixes a bug that was causing the people page to not allow you to edit users
- Adds smart color contrasting for the color picker in the campaign creation flow so that you can read the name of your campaign name no matter which color you make it
- Adds an option to allow sharing a single postgres database across multiple Spoke instances, but keep data separate, e.g. using `heroku addons:attach`
- Schema changes paving the way for scaling improvements
- Fixes editing files in emacs by avoiding using unicode
- Allows the Google Script Import feature to be deployed on AWS Lambda

Deploy Steps:

**Instructions for migrating large database instances (>1million messages/contacts)**

1. Make sure SUPPRESS_MIGRATIONS=1 in your environment
2. Before deploying the code, you will want to do most of these changes (manually) beforehand, ideally while the system is down. If you are planning to do these migrations before deploying the new code, we strongly recommend merging [this PR separate from the schema changes](https://github.com/MoveOnOrg/Spoke/pull/1346) BEFORE these steps to your production instance. It removes a few bugs which caused postgres to deadlock on message table updates. Instructions below assume Postgres.

2.1 Create the additional columns:

```
ALTER TABLE message ADD COLUMN campaign_contact_id integer NULL REFERENCES campaign_contact(id);
ALTER TABLE message ADD COLUMN messageservice_sid text NULL;
ALTER TABLE message ALTER COLUMN assignment_id DROP NOT NULL;
```

These should be non-blocking and 'quick' -- i.e. downtime is probably unnecessary.

2.2 Once those complete, you will want to create the campaign_contact_id INDEX:

```
CREATE INDEX CONCURRENTLY message_campaign_contact_id_index ON message (campaign_contact_id)
```

The CONCURRENTLY adverb should make this possible without downtime, but sometimes caution is best.

2.3 (LOCKING: Best with system unstressed/down) Next you want to start filling in the campaign_contact_id. You may want to prioritize live or recent campaigns with additional qualifications or do this in batches with a command similar to:

```
UPDATE message
SET campaign_contact_id = campaign_contact.id
FROM campaign_contact
WHERE message.assignment_id = campaign_contact.assignment_id
  AND message.contact_number = campaign_contact.cell
  AND message.id IN (
    SELECT id
    FROM message
    WHERE campaign_contact_id IS NULL
    LIMIT 1000000
  )
```

Note the "LIMIT 100000" is doing it in batches of 1 million. Another strategy would be to find the lowest campaign_contact_id value for your live campaigns and add a `WHERE campaign_contact.id > XXX` where XXX is that value (or do the same thing for message.id > XXX).

This WILL LOCK the MESSAGE table -- and thus stop processing of events, so you will want to do this off-hours, ideally with the system down.

Once you have done this with the majority of messages, especially messages for live campaigns, you should now be ready for _real_ downtime.

2.4 (LOCKING: _Requires_ downtime) The final step is to definitely take the system down if you haven't already. Complete updates to messageservice_sid and campaign_contact_id, there are some final steps:

```
CREATE INDEX CONCURRENTLY cell_messageservice_sid_idx ON message (contact_number, messageservice_sid);
DROP INDEX message_contact_number_index;
INSERT INTO knex_migrations (name, batch, migration_time) VALUES
  ( '20191217125726_add_message_campaign_contact_id.js', 3, now()),
  ( '20191217130355_change_message_indexes.js', 3, now()),
  ('20191217130000_message_migrate_data.js', 3, now());
```

2.5 Deploy the new code!
2.6 As soon as possible (after system is working) then run:

```
DROP INDEX message_assignment_id_index;
```

NOTES:

- One of the main challenges besides migrating and indexing a large table is that many indexes on the `message` table with so many inserts, can tax the insertions too much and slow the system down. So, while we are indexing both assignment_id AND contact_number AND contact_number+messageservice_sid AND campaign_contact_id, the system is likely to be over stressed. This is why we stagger the index creation and then drop the unnecessary indexes as soon as we have the system up again. Obviously if ALL these steps are done during a single downtime, event, then that would work too -- but staggering them can allow shorter and stepped periods of downtime or migration.

Thanks to all the contributors part of this release including:
[lperson](https://github.com/lperson),
[jeffm2001](https://github.com/jeffm2001),
[SAnschutz](https://github.com/SAnschutz),
[schuyler1d](https://github.com/schuyler1d)

## v4.1

_January 2019:_ Version 4.1

This release includes the following improvements:

- Fixes twilio bugs for incoming text spam and message duplicate tests
- Fixes bug in which Spoke was not scrubbing opt outs from larger organizations

Thanks to @schuyler1d and @strangeways for these critical fixes. This patch will be required in order to successfully update to v5.0

## v4.0

_December 2019:_ Version 4.0
**Note:** This is a major release and therefore requires a schema change. See the deploy steps section for details.

This release includes the following improvements:

- Adds better error logging to Spoke allowing visibility into errors that twilio and other messaging services are sending rather than them getting "lost"
- Fixes bulk send, which is used outside the USA to send more than one initial message with a single button click making it usable again!
- Multiple documentation fixes including better documentation on how to run the test suite
- Adds 2 React component tests
- Fixes bugs that wouldn't let you exit out of adding a new script, that made reassigning contacts often not work, that would often cause the skip reply button not to appear
- Updates the google-libphonenumber library to allow phone numbers using newer area codes (e.g. 463) to be validated.

Deploy Steps:

- Warning: This migration removes the `message.service_response` column which tracks responses to/from the Twilio API.
  This data is not needed for the application to function, but e.g. some users have queried it to keep the MediaUrl values
  (i.e. images sent to the texter, even though they aren't displayed). After the migration, they will still be queryable for
  new texts (only POST-migration texts) in the `log` table. If you're not sure, then before deploying, make sure you backup
  the `message` table--at least the `message.service_response` column.
- For the speediest migration, we recommend DELETING all past log rows with `TRUNCATE TABLE LOG`.
  Before doing so, consider backing up the `log` table -- though no data there is needed for running the application (and it takes up considerable space).
- For smaller instances (less than 1 million texts/contacts), the migration should complete automatically.
- For larger instances, it's better to enable the environment variable `SUPPRESS_MIGRATIONS=1`
  and then follow the relevant steps of your platform to upgrade ( [Heroku](./HOWTO_HEROKU_DEPLOY.md#migrating-the-database), [AWS Lambda](./DEPLOYING_AWS_LAMBDA.md#migrating-the-database) )

Thanks to all the contributors part of this release including:
[ibrand](https://github.com/ibrand),
[lperson](https://github.com/lperson),
[jeffm2001](https://github.com/jeffm2001),
[SAnschutz](https://github.com/SAnschutz),
[schuyler1d](https://github.com/schuyler1d),
[briantam23](https://github.com/briantam23),
[tstickles](https://github.com/tstickles)

## v3.2

_November 2019:_ Version 3.2.0

This release includes the following improvements:

- Fixed bug that was not allowing texts to be reassigned in message review
- Multiple documentation fixes and copy adjustments in the UI
- Fixes bug that made deployment fail for AWS Lambda
- Adds redis into the testing suite for more reliable tests

Thanks to all the contributors part of this release including:
[stevenfranks](https://github.com/stevenfranks),
[ibrand](https://github.com/ibrand),
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[zhaluza](https://github.com/zhaluza),
[WSINTRA](https://github.com/WSINTRA)
[joemcl](https://github.com/joemcl)

## v3.1

_September 2019:_ Version 3.1.0

This release includes the following improvements:

- Adds prettier as a way to encourage code consistency across the project
- Adds documentation for our Code of Conduct
- Fixes some bugs around copying campaigns
- Fixes bugs for new instances deployed to Heroku

Thanks to all the contributors part of this release including:
[filafb](https://github.com/filafb),
[ibrand](https://github.com/ibrand),
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[shakalee14](https://github.com/shakalee14),
[strangeways](https://github.com/strangeways)

## v3.0

_August 2019:_ Version 3.0.0

This release includes the following improvements:

- Knex Migration Configuration (see note below)
- An upgrade to Node 10
- A new feature - Google Doc Imports for Interactions / Campaign Scripts
- Additions to the caching layer
- More texter tests
- Improvements and standardization on the developer experience
- Improvements in documentation, including the README.md
- Addition of a favicon
- Adding automatic capitalization to new user names
- New Upland Mobile Commons Action Handler / Integration with documentation
- New documentation "how to" guide for deciding to adopt Spoke

Note on Knex Migration:
Anyone that is upgrading from a version released earlier than March 2018 should see this issue comment:
https://github.com/MoveOnOrg/Spoke/pull/1154#issuecomment-510163604

Thanks to all the contributors part of this release including:
[AnuradhaNaik](https://github.com/AnuradhaNaik),
[azuzunaga](https://github.com/azuzunaga),
[filafb](https://github.com/filafb),
[harpojaeger](https://github.com/harpojaeger),
[ibrand](https://github.com/ibrand),
[joemcl](https://github.com/joemcl),
[lperson](https://github.com/lperson),
[mathemagica](https://github.com/mathemagica),
[rcackermanCC](https://github.com/rcackermanCC),
[schuyler1d](https://github.com/schuyler1d),
[shakalee14](https://github.com/shakalee14)

## v2.0

_April 2019:_ Version 2.0.0

This release includes an improvement to message sending speeds, many usability improvements to the Admin Message Review panel, bug fixes for different features, improved data warehouse querying for audiences, Docker support/documentation, Local Authentication, etc. We also have switched to using `yarn` dev and install commands versus `npm`. To see an updated feature list, please visit opensource.moveon.org/spoke.

Migrations:

- Texting hour related columns to the `Campaign` table.
- Send_before column to the `Message` table.
- Creator_id column to the `Campaign` table.

Heroku:

The Heroku deployment method has been migrated to the container runtime. When upgrading an existing Heroku app, these [migration steps](https://github.com/MoveOnOrg/Spoke/blob/33e2edcc455836f36eafd56d585430ac1ceda515/docs/HOWTO_HEROKU_DEPLOY.md#upgrading-an-existing-heroku-app) will need to be performed.

Lambda:

This version includes an update for the Node runtime environment. For current AWS Lambda Users - you can update your Node runtime to 8.10 by either visiting the `Function code` Section and moving the drop down to 8.10 or by running the following script: `claudia update --runtime nodejs8.10`. For new Lambda deployments, Claudia.js will default to Node 8.10.

Thanks to all the contributors part of this release including:
[anasauceda](https://github.com/anasauceda),
[azuzunaga](https://github.com/azuzunaga),
[bchrobot](https://github.com/bchrobot),
[benhiller](https://github.com/benhiller),
[harpojaeger](https://github.com/harpojaeger),
[jlegrone](https://github.com/jlegrone),
[joemcl](https://github.com/joemcl),
[jparkrr](https://github.com/jparkrr),
[lperson](https://github.com/lperson),
[sandramchung](https://github.com/sandramchung),
[schuyler1d](https://github.com/schuyler1d),
[shakalee14](https://github.com/shakalee14)

## v1.4.1

_August 2018:_ Version 1.4.1

- This version fixes bugs found in 1.4 including a deployment bug.

## v1.4

This release includes many optimizations, new features and more tests! We've fixed outstanding bugs, added more administrative functionality and worked on the texter experience. We've also introduced a new testing suite and redis caching capabilities. Over the next couple months, we intend to add more testing and continue to work on scaling.

Note - we will have a new release in the next few weeks and switch to a shorter release cycle in the next few months. Please upgrade your instance and let us know if you find any bugs or have questions!

_July 2018:_ Version 1.4

- A 'Skipped Messages' section for texters to allow access to previously skipped conversations. Skipped conversations can be 'reopened' and filter back into the 'replies' view.
- A 'Message Review' board for administrators to allow message reassignment to different texters. Administrators also have the ability to see more incoming messages than previous.
- The ability to mark contacts as opted out without sending a message.
- Selenium end to end testing with Sauce Labs integration.
- Redis caching capabilities including caching user's authentication status.
- Updates to documentation for AK integration, popular queries, and email and data exporting integration.
- Bug fixes around owner, admin and superadmin permissions when attempting to text, timezone handling, permission issues on admin dashboard.
- Update to our community guidelines.

Thanks go to all our contributors for this release including:
[azuzunaga](https://github.com/azuzunaga),
[bchrobot](https://github.com/bchrobot),
[bdatkins](https://github.com/bdatkins),
[cp4r3z](https://github.com/cp4r3z),
[codygordon](https://github.com/codygordon),
[eXrump](https://github.com/eXrump),
[harpojaeger](https://github.com/harpojaeger),
[joemcl](https://github.com/joemcl),
[lperson](https://github.com/lperson),
[mathemagica](https://github.com/mathemagica),
[shakalee14](https://github.com/shakalee14)

## v1.3

Two major themes that we are focusing on this year are improving
integrations and scaling. This release begins that work with support
for MailGun notifications and Revere subscriptions. In order to scale
work-flows, we have added a new SuperVolunteer position and now allow
texters to update their own information.

Over the next couple months, we intend to integrate with more outside
systems and we will also be adding significant work
around scaling the system to support much larger volumes and participants.
We will also be continuing to add more automated tests to scale participation.
All of that is to make sure that the growing community can keep adding
enhancements yourself -- please jump in on our issues page to either
implement something or file an issue on something you want Spoke to do!

Please upgrade your instance and let us know if you encounter any issues!

_April 2018:_ Version 1.3

- A 'Past Messages' section for Texters to allow access to previous conversations before a reply comes back.
  This feature helps cases where someone accidentally clicked a button or wants to follow-up with requested information.
- Texters can update their name, email and other information from the menu.
  Admins can update texter info from the console
- A new SuperVolunteer role, which allows a non-admin to update assignments, and [some other tasks](https://github.com/MoveOnOrg/Spoke/issues/455)
- Added [MailGun support](HOWTO_HEROKU_DEPLOY.md#setting-up-mailgun)
- Frontend React tests!
- Added an action handler to automatically subscribe to a [Revere](https://reverehq.com/)
  SMS list -- see [Revere integration instructions](HOWTO_INTEGRATE_WITH_REVERE.md)
- Fixed some bugs:
  - The texter menu now has a home button
  - The zipcode table was too big to fit in a free Heroku database
  - Some login issues were fixed and documentation was improved
  - Improved contact load times for texter screen

Thanks go to all our contributors for this release including:
[ben-pr-p](https://github.com/ben-pr-p),
[harpojaeger](https://github.com/harpojaeger),
[lperson](https://github.com/lperson),
[shakalee14](https://github.com/shakalee14),
[schuyler1d](https://github.com/schuyler1d),
[zluo16](https://github.com/zluo16),
[jparkrr](https://github.com/jparkrr),
[JeremyParker](https://github.com/JeremyParker),
[hiemanshu](https://github.com/hiemanshu),
[Dayologic](https://github.com/Dayologic),
[hi0ctane](https://github.com/hi0ctane),
[sandramchung](https://github.com/sandramchung),
[sreynen](https://github.com/sreynen),
[mathemagica](https://github.com/mathemagica)

## v1.2

_January 2018:_ Version 1.2 is our second release since MoveOn has adopted Spoke. We are committed to fixing bugs, adding new features and making this project as nimble as possible. For this release, we've included changes from [GetUp](https://www.getup.org.au/), updated certain dependencies, updated Auth0 integration, added user editing capabilities for texters and admins and continued to add outside integration points with outside CRMs. Please continue to add and work on our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues). We have also switched from `master` => `main` as a new naming convention for the most stable/default branch.

We've worked on a lot, but some critical developments to highlight include:

- Adds dynamic assignment functionality for texters
- Adds user editing capabilities for texters and administrators
- Adds support for customized styling for campaigns
- Adds ActionKit integration for event sign up and documentation
- Adds support for multi-media images in outgoing texts (mms)
- Adds support for campaign script editing on live campaigns
- Moved to Prop-Types library, upgraded Webpack and other development dependencies
- Adds Code Climate test integration to monitor test coverage
- Adds opt out count for a campaign to admin dashboard stats
- Adds free Heroku deployment setup
- Adds more automated tests

Thanks go to to all our contributors for this release including: [jmcarp](https://github.com/jmcarp), [hiemanshu](https://github.com/hiemanshu), [lperson](https://github.com/lperson), [jparkrr](https://github.com/jparkrr), [jamesr2323](https://github.com/jamesr2323), [benmort](https://github.com/benmort), [ben-pr-p](https://github.com/ben-pr-p), [lady3bean](https://github.com/lady3bean), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen), [mathemagica](https://github.com/mathemagica)

## v1.1

_October 2017:_ Version 1.1 is our first release since MoveOn has been using Spoke successfully in production. We are committed to
making this an open-source project used and developed by the wider progressive tech community to advance our
political goals. Part of our work has been to make that transparent. Besides this public repository, please help
with our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues), including those marked `easy`.

But of course, we've also done some actual development work! We've fixed a ton of bugs, but here are some
highlights for this release:

- Adds a passing test framework
- Resolves many bugs related to saving and updating a Campaign for admins
- Improves the Texter interface (better reply visibility, especially on mobile) along with sending on `<Enter>`
- Adds a [Deploy to Heroku](https://github.com/MoveOnOrg/Spoke#deploy-to-heroku) button for easier first-time deployments
- Documented [how to deploy on Amazon AWS Lambda](DEPLOYING_AWS_LAMBDA.md)
- Migrated from a RethinkDB backend to a Knex.js backend (we recommend use with postgresql database)
- Improved Spoke's security

Thanks go to to all our contributors including: [anasauce](https://github.com/anasauce), [hiemanshu](https://github.com/hiemanshu), [mathemagica](https://github.com/mathemagica), [sandramchung](https://github.com/sandramchung), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen)
