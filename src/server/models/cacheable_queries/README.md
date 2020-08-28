## Caching goals

Caching can speed up responses and lookups (and possibly writes, too) by several orders of
magnitude.  However, adding caching layers also adds complexity to an application.  It can
make features more difficult to add, and simple changes can accidentally affect the optimizations
the cache was meant for.

Scaling Spoke is an active project and this directory and its relationship with the codebase
may change.  Nonetheless, the first round has the following goals:

* Optimize the Texter experience
* Find as many gains from reading from the cache instead of the database as possible

## Places to be most careful about caching

* Anywhere in server/api/*, especially assignment.js and campaign-contact.js
* When editing/updating a campaign, we need to be careful about clearing the caches when appropriate
* If we add server/api/ resolvers or add fields in containers/TexterTodo.jsx
  we should think carefully about caching consequences. If we go ahead, then we'll need
  to make sure the data is cached by the time the Texter accesses the data.

## Cached Objects (with most common lookup method)

* user `userLoggedIn(authId)`
* organization `load(id)`
* campaign `load(id)`
* cannedResponse `query({ campaignId, userId })` (userId='' for campaign-wide canned responses)
* optOut `query({ cell, organizationId })`, `save({cell, campaignContactId, campaign, assignmentId, reason})`
* campaign-contact `load(id)`
* message `query({ campaignContactId })`, `save({messageInstance, contact})`

## Code Style for Consuming cacheableData API

Generally `import { cacheableData } from 'server/models/cacheable-queries'` provides a
per-object interface.  Not all interfaces are the same, based on what can/should be cached.

If a caccheableData object is available then server code should generally try to use it
for speeding up responses.  Occasionally, for admin interfaces, e.g., it's worth
forcing a database query, but especially for object-lookup, this is generally just inefficient.

If you are loading an object by id, then the best way to do that in server code is to
use the `loaders` object, e.g. `await loaders.campaign.load(campaignId)` will return
a campaign object however is best (cache or not).

In api resolvers (i.e. the methods in /api/*.js files), occasionally the method may have a
cached version already populated on the object.
For example in `server/api/campaign.js` interactionSteps is cached *with* the campaign object,
so by the time you get to the `interactionSteps` resolver, the result is available already.
In these cases, we should name the cached result the same as the resolver method.  This way,
we can test whether our result is already cached by testing for `campaign.interactionSteps`, otherwise,
we can make the db call -- often that db call will be available through a cacheableData object method,
in which case you should use that.

### cacheableData Object Method Definitions

There are a host of other object-specific methods, but methods with these names all
should behave the save way.  All are `async` methods.

* `load(id)` -- will load from cache if, available and otherwise from the database.
  If appropriate, it may save the result in the cache (some situations,
  it's better not to, because loading should happen purposefully at specific times)
  Note: This needs to send an adapted Model object, so e.g. it should return a
  `new Campaign(campaignData)` object and not just `campaignData`
* `clear(id)` -- will clear from the cache for a specific id -- you should do this whenever
  the object is updated in the database.
* `reload(id)` -- if this method exists, it often means loading the cache may be more
  expensive than a single database call for the id's data.  While using `clear(id)` clears
  the cache and then waits for the next request to cache the data, `reload()` can be used
  to load the cache at the right moment instead of burdening a future request with it.
* `save(objectValues)` -- this will create an object in the db and update the cache.
  In the future, if we have a mode that writes to cache-only, and then syncs later, that
  logic can/will be captured in the cacheableData save method.  If there *is* a save method,
  then ALL saving of that model should be done through it.
* `query(objectValues)` -- a query of multiple values other than id that can return an object.
  A classic example is in `cacheableData.optOut.query({ cell, organizationId })` where opt outs
  will be unique by cell-organization pairs.  Most query methods will only take specific
  items -- *not any* set of values.  If you need to query the object by a different set of
  values, that may have adverse affects with the cache and/or response speed, so think through
  the consequences.
* `clearQuery(objectValues)` -- this is a complement to `query()` and clears the result.
  Depending on the method, it 

Others:
* `loadMany()` -- this will often take arguments to load a dataset into the cache, e.g. all
  the opt-outs for a particular organization.

## Data-structures

Note that cacheable_queries/ files are organized around redis keys.  No key will be directly
looked up or changed except in the file its in.  Key-creation methods will always be at the
top of the file and should *never* be `export`ed.  All redis commands should use those methods -- never
manually referencing a key inline.  All root keys are prefixed by the environment variable `CACHE_PREFIX`.

* user
  * KEY `texterauth-${authId}`
  * HASH `texterroles-${userId}`
    * key=orgId, value=highest_role:org_name
* organization
  * KEY `org-${orgId}`
* campaign
  * KEY `campaign-${campaignId}`
    * Besides campaign data, also includes `customFields`, `interactionSteps`, `contactTimezones`
  * HASH `campaigninfo-${campaignId}`
    * key={"assignedCount", "messagedCount"}, value=countValue
* cannedResponse
  * KEY `canned-${campaignId}-${userId}`
    * For non user-specific campaigns userId=''
* optOut
  * SET `optouts${-orgId|}`
    * if OPTOUTS_SHARE_ALL_ORGS is set, then orgId=''
* campaign-contact (only when `REDIS_CONTACT_CACHE=1`)
  * KEY `contact-${contactId}`
    * Besides contact data, also includes `organization_id`, `messageservice_sid`, `zip.city`, `zip.state`
    * However it does NOT have message_status or assignment_id which are in separate keys, since status and assignment often change after a campaign is started (when contact cache is created). All these keys are merged together with `.load(contactId)` so it's mostly transparent to the user.
    * contact.cachedResult will be present when loaded from cache.
  * KEY `contactstatus-${contactId}`
    * Stores `contact.message_status` for the contact
  * HASH `contactassignment-${campaignId}`
    * key=contactId, value=assignment_id:user_id
    * Stores `contact.assignment_id` for the contact (and also user_id)
    * This is a HASH by campaignId, so it's easier to clear all assignments in a campaign in one step.
  * KEY `cell-${cell}-${messageServiceSid}`
    * value=`{contact_id}::{timezone_offset}`
    * This is saved on the sending of the first message, for easy lookup of the contact info when a response comes in from the contact.  This is done through the api `.updateStatus(contact, newStatus)`. You can access the data from `.lookupByCell(cell, service, messageServiceSid)`
* questionResponse (only when `REDIS_CONTACT_CACHE=1`)
  * KEY `qresponse-${contactId}`
    * stores JSON array of `[{interaction_step_id, value}, ....]`
* message (only when `REDIS_CONTACT_CACHE=1`)
  * LIST `messages-${contactId}`
    * Includes all message data
