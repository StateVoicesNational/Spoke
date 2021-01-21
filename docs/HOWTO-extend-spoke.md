# Extending Spoke

The Spoke project tries to make Spoke as easily extensible in as many places as possible.
This helps greatly with allowing campaigns in a rush to roll out features quickly that have
the greatest hope of being merged back in without conflicts from other campaigns.  It also
allows us to maintain something that works with a large set of different configurations to
meet the demands of different campaigns and organizations.

While enabling extensibility, we also want to make sure that Spoke system administrators
have full control over what extensions are enabled and usable on the system.

This is especially helpful with vendor integrations (e.g. in Action handlers and Contact loaders)
but also allows quite a bit of customization with the texter experience without diving
deeply into the components.

# Extension points.

For each extension point there is a directory in `src/extensions` where adding a directory with a file
will get you started.  Each extension type also has an environment variable that can dictate which
extensions are enabled.  The environment variable is a comma-separated list (without spaces) is.

These can also be configured and set in the `organization.features` column of an organization so they
can be enabled for only particular organizations.  Some examples help:

```
  ACTION_HANDLERS=ngpvan-action,zapier-action
  TEXTER_SIDEBOXES=default-dynamicassignment,default-editinitial,default-releasecontacts
```

The first enables two action handlers: `ngpvan-action`, `zapier-action` which are in
the [src/extensions/action-handlers](https://github.com/MoveOnOrg/Spoke/tree/main/src/extensions/action-handlers)
directory.  Both of these require additional environment variables to function, so make sure
to read the code or documentation on particular extensions.

The second enables *and restricts* the system to three texter sideboxes.  Texter sideboxes, by default,
have all system-included sideboxes on (though they are configurable in the Organization's settings and
per-campaign).  They are each in the  [src/extensions/texter-sideboxes](https://github.com/MoveOnOrg/Spoke/tree/main/src/extensions/texter-sideboxes) directory.

Here are supported extension types with brief descriptions:

## [Action handlers](HOWTO-use-action-handlers.md)

Action handlers hook into Spoke's survey/question responses in a script and also when
tags are applied to a contact.  They are useful for syncing data to other systems like
event signups, donation agreements, etc.

## [Contact loaders](HOWTO-use-contact-loaders.md)

Contact loaders hook into how Spoke loads contacts in a campaign.  The main (default)
contact loader is uploading a CSV, but you can setup both a user-facing interface to
choose options and a backend that loads contacts in other ways or from other sources.

## [Texter sideboxes](HOWTO-use-texter-sideboxes.md)

There are so many ideas and possibilities with extending the Texter interface, but
this is also prime real-estate to meet the screen-realestate needs of small smart
phones along with desktops.  Texter sideboxes give a 'sidebar' space on desktops and
make more options/controls a click away (or a way to popup).  Texter sideboxes are
passed the context of the contact being shown, the texter, the campaign, and organization,
and can show relevant additional data or controls.

Texter sideboxes also can extend "Todos" assignment listing -- to show additional controls
or information.

Each Texter sidebox included in configuration is automatically enableable per-campaign and
configurations that drive how the sidebox is shown (like custom text/messages/etc) can be easily
built in.

## [Message handlers](HOWTO-use-message-handlers.md)

When a message is received from a contact or sent from a texter, message handlers can hook in
both right before and right after a message is saved to the database.  Before save, you
can alter a message's content or details.  After save, you can trigger additional actions.
It's also possible to block a message from saving.

## [Dynamic assigment batches](HOWTO-use-dynamicassignment-batches.md)

Dynamic assignment is when texters join a campaign and send texts is 'batches' with the
ability to "get another batch" after sending the first.  Many campaigns have different
policies around what the conditions for getting a second batch are.  The default is
"finished-replies" which requires that if there are any replies, that they be answered
before completing another batch.  But this extension point allows different rules (per-campaign)
to dictate when a texter can request more messages.


# Other places to extend Spoke

We are slowly trying to make the pattern that extensible parts of Spoke are in the
src/extensions directory and behave in similar ways.  However a couple have not been moved yet
(If you have time, consider helping with a pull request to do so!)

## Message Services

Spoke has been developed to work best with Twilio at time of writing (Aug 2020).  However,
you can set the DEFAULT_SERVICE either in the environment variable or in an organization
to change the message service for that organization.  Message services are currently in files
in the [src/server/api/lib](https://github.com/MoveOnOrg/Spoke/tree/main/src/server/api/lib) directory,
and adding a message service is possible by making


## Login

We recommend production instances use Auth0 for login by default.  Additionally for development,
"local login" is configurable so Auth0 doesn't need to be setup.  There is also a way to enable
login through Slack.  All of these implementations are *mostly* implemented in two files:

* [src/server/auth-passport.js](https://github.com/MoveOnOrg/Spoke/tree/main/src/server/auth-passport.js)
* [src/components/Login.jsx](https://github.com/MoveOnOrg/Spoke/tree/main/src/components/Login.jsx)

However there are a couple places here or there that have hooks -- at least for more sophisticated
integrations.  Ideally we will consolidate these hooks into a src/extensions/login/ in the future.


# Future hooks

* On-campaign-start and on-campaign-completion are good places to trigger some actions
* Just like contact-loaders hook in to ways to load contacts, it would be good to allow extensions
  to load scripts and canned responses from other sources.  There's already a Google Doc script import
  option.  Abstracting this could provide useful tools and integrations into other campaigning systems/APIs.
