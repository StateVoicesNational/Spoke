# Message Handlers

When a message is received from a contact or sent from a texter, message handlers can hook in
both right before and right after a message is saved to the database.  Before save, you
can alter a message's content or details.  After save, you can trigger additional actions.
It's also possible to block a message from saving.

## Message Handler configuration options

Like other extensions, MESSAGE_HANDLERS= expects a comma-separated list of extensions
without spaces.  Many message handlers require additional environment variables to be set.
For now, the best place to understand a message handler is to read the code especially
the `serverAdministratorInstructions`.

## Included Message Handlers

### initialtext-guard

If texters change the initial text, this handler will mark those messages and contacts with
`error_code=-167` so you can track who is changing the initial message.  Note that if the
campaign admin changes the initial script after the campaign starts, there will likely be a
number of initial messages that are marked this way between the time texters environment
refreshes (20 seconds) and the messages they send in the interim.

### auto-optout

Works just by enabling to auto-optout contact replies that include phrases like
"STOP" or "unsubscribe" -- we recommend enabling this.  It's possible to configure
AUTO_OPTOUT_REGEX_LIST_BASE64 with a custom (base64-encoded) JSON object that includes
a list of regular expressions to match against contact replies.

This is especially useful to auto-optout hostile contact replies so texters do not
need to see them.  Additionally the JSON object can encode a "reason_code" that will
be logged in the opt_out table record.

### profanity-tagger

Before you enable a custom regular expression with auto-optout, we recommend strongly
testing it with profanity-tagger.  profanity-tagger will `tag` a contact with
the message.  After creating tags, set PROFANITY_CONTACT_TAG_ID and PROFANITY_TEXTER_TAG_ID
in the `organization.features` column (and clear the cache).

Besides just tagging contacts, you can also enable PROFANITY_TEXTER_BLOCK_SEND to block
profane language if untrained texters (or trolls) try to send messages.

### to-ascii

Copying from Word/Google Docs often smart quotes or mdashes end up in texts which forces
the message to unicode increasing message size significantly.  Enabling this message handler
will transform those messages back to ascii.  Make sure to enable this handler after initialtext-guard
in MESSAGE_HANDLERS= so scripts don't auto-flag everything as an initial change.

### outbound-unassign

When campaign.features has TEXTER_UI_SETTING..takeConversationsOutboundUnassign enabled
(by the take-conversations texter sidebox), this will automatically unassign contacts as
soon as the initial texter sends the message.  This allows a separation of initial texters
and texters involved in replying to messages.

### ngpvan

Updates contacts in NGPVAN system with a status of Texted after the initial message is sent.


## Developing Message Handlers

The best way to make a new message handler is something like this in the codebase:

```
cd src/extensions/message-handlers
cp -rp initaltext-guard <NEW_NAME>
```

Then edit index.js in that directory.


### API properties for message handlers

Export methods/constants with these names from your index.js:

* `function serverAdministratorInstructions()` should return an object with
  keys "description" and "setupInstructions" with string values for administrators
  and another key "environmentVariables" with a list of strings of environment
  variables relevant to the message handler.
* `function available(organization)` *required* function called before the functions
  below to indicate whether they should be run.
  * Note that this is NOT async.  If you have async needs to decide further whether
    to take an action include them in the relevant functions (and then you can
    decide to do nothing).
* `async function preMessageSave()` called before the message is saved. Best for
   use to modify the message or contact in some way.
   * Arguments:
     ```
     preMessageSave({
       messageToSave,
       activeCellFound,
       matchError,
       newStatus,
       contact,
       campaign,
       campaignId,
       organization,
       texter
     })
     ```
     * See src/server/models/cacheable_queries/message.js::save for the context of
       these values.
     * Some variables are empty/full depending on whether the `message.is_from_contact`
       For example, `campaign` will NOT be available when it is_from_contact.
  * Return a dict which can be empty, or with any of the following keys:
    * `messageToSave` will replace the messageToSave passed in.
    * `matchError` replaces the matchError passed in which
      can be "DUPLICATE MESSAGE DB" or "DUPLICATE MESSAGE CACHE"
      and blocks saving.  You can e.g. return null and override the blocked save (or vis-versa)
    * `cancel` if truthy returns without saving the message
    * `contactUpdates` can be a dict with values that will update the contact record.
      E.g. `{ error_code: -167 }` will update the contact error_code.


* `async function postMessageSave()` called after the message is saved and when
   `message.id` is available.
  * Arguments are the same as preMessageSave EXCEPT `message` instead of `messageToSave`
  * Return nothing or a dict which can have any of the following keys:
    * `blockSend` -- the message is saved (it is *post*MessageSave) but it is NOT
      sent e.g. through Twilio.  This is useful for e.g. messages that were
      censored due to profanity or another condition -- it's worth saving the record
      of the message but we do not want to send.
