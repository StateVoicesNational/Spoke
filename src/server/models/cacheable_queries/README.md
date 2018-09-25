## Caching goals

Caching can speed up responses and lookups (and possibly writes, too) by several orders of
magnitude.  However, adding caching layers also adds complexity to an application.  It can
make features more difficult to add, and simple changes can accidentally affect the optimizations
the cache was meant for.

Scaling Spoke is an active project and this directory and its relationship with the codebase
may change.  Nonetheless, the first round has the following goals:

* Optimize the Texter experience
* Find as many gains from reading from the cache as possible

## Places to be most careful about caching

* Anywhere in server/api/*, especially assignment.js and campaign-contact.js
* When editing/updating a campaign, we need to be careful about clearing the caches when appropriate
* If we add server/api/ resolvers or add fields in containers/TexterTodo.jsx
  we should think carefully about caching consequences. If we go ahead, then we'll need
  to make sure the data is cached by the time the Texter accesses the data.

## Cached Objects (with most common lookup method)

* user
* organization `load(id)`
* campaign `load(id)`
* cannedResponse
* optOut `query({ cell, organizationId })`, `save({cell, campaignContactId, campaign, assignmentId, reason})`
* assignment `load(id)`
  * assignment-contacts
* campaign-contact `load(id)`
* message `query({ campaignContactId })`, `save({messageInstance, contact})`

## Code Style

Generally `import { cacheableData } from 'server/models'` provides a
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
we can make the db call -- often that db call will be available 

### cacheableData Object Method Definitions

All are `async` methods.

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

* user
  * KEY `texterauth-${authId}`
  * HASH `texterroles-${userId}`
    * key=orgId, value=highest_role:org_name
* organization
  * KEY `org-${orgId}`
* campaign
  * KEY `campaign-${campaignId}`
    * Besides campaign data, also includes `customFields`, `interactionSteps`, `contactTimezones`
* cannedResponse
  * KEY `canned-${campaignId}-${userId}`
    * For non user-specific campaigns userId=''
* optOut
  * SET `optouts${-orgId|}`
* assignment
  * KEY `assignment-${assignmentId}`
    * Besides assignment data, also includes `organization_id`, `user.first_name`, `user.last_name`
* (assignment-contacts) (library only, used by assignment and campaign-contact)
  * SORTED SET `assignmentcontacts-${assignmentId}-${timezone_offset}` 
    * key=contactId, score={0=optedout, 1=needsMessage, 200...-399...=needsResponse, ...}
    * See the top of [./assignment.js](./assignment.js) for more details on this complex data structure.
* campaign-contact
  * KEY `contact-${contactId}`
    * Besides contact data, also includes `organization_id`, `messageservice_sid`, `zip.city`, `zip.state`
    * However it does NOT have message_status which is the key below, since status changes frequently
  * KEY `contactstatus-${contactId}`
    * Just stores message_status for the contact
  * KEY `cell-${cell}-${messageServiceSid}`
    * value=`{contact_id}:{assignment_id}:{timezone_offset}`
    * This is saved on the sending of the first message, for easy lookup of the contact info when a response comes in from the contact.
* message
  * LIST `messages-${contactId}`
    * Includes all data _except_ service_response

## Expiration

Generally we want expiration to be as simple as possible.  Simple objects that load
a single record can expire from cache, but if they are still being used, then they
will reload into cache simply with a primary key lookup.

However some stories are more complicated:

* If loading the cache record is expensive -- especially relative to what the
  db query would be without caching -- then we should make sure that the
  cache is loaded at the 'right time' and then ideally stays in cache until it
  truly isn't used anymore.
* Since some cache data is denormalized, it may become difficult to 'refresh' the
  cache data after a particular DB update. We want to avoid the equivalent of 'dangling' pointers.
  An example of this is `assignment` stores the first/last name of the texter,
  However, if the texter's first/last name are updated, it may be difficult to
  refresh the assignment cache which is 'far away' from the user data.

### Simple caching expiration 'stories'

* `user` (1 day): user metadata is cached based on auth0_id which makes each cookie/request identification
  fast. Roles are stored per organization. These all expire within 24 hours, and if they are out of
  cache, they are re-cached on first login, and so should stick around for the length of a session.
* `organization` (1 day): Organization metadata is used quite often for all sorts of requests.  Cache
  expires after a day, but in practice any organization that is being used will have the data in
  cache, from the first login of the day from the first user in the organization.
* `campaign` (1 day): Campaign metadata is only stored for non-archived campaigns. Campaign metadata is
  generally refreshed on campaign admin actions. There are a couple 'more expensive' parts of
  loading campaign metadata, but all of them would be needed for any texter role for a campaign,
  so if the campaign isn't already cached, then the first login of a texter in that campaign will
  load all the data.
* `cannedResponse` (1 day): Canned responses are never loaded individually -- both the admin and the
  texter gets all of them per-campaign. Thus for any active campaign, they will stay in cache, and
  in the case, they disappear, it's no extra db query than what would be needed for the first texter.

### Mostly-simple expiration stories

* `optOut` (1 day): Whether opt-outs are per-organization or global for the instance, they are
  needed to load each and every contact's data, to ensure we don't send a message to someone
  opted-out, even if they opted out from a second organization/campaign.

  Thus, we need all optOuts loaded, and it's 'all or nothing' -- so when optOut is not found
  in cache, we load every record in at once, however asynchronous to the request that triggered
  it.  We could, in theory, keep the optOut cache in much longer, but this could then lead to
  drift if there are any 'missed' saves.  To avoid this, we do an optOut update for every
  contacts upload job -- we put it in the job, because the opt_out table might be very large,
  and syncing could be a significant process. By doing it on contact upload, we can make sure
  that the cache exists before each campaign starts.
* `message` (1 day since last add): Message is mostly simple but when it enters and exits cache
  is a little interesting.  When a texter sends a first messaage to someone with message_status
  needsMessage (i.e. first contact), we create the message LIST cache with the first message.
  That cache stays for 1 day, unless we receive a response, and then we will wait another
  24 hours before expiring the cache.  In practice, this means most campaigns will run with
  the message cache continuously hot.  If the campaign goes past a second day, then generally
  texters will be going only to the 'needsResponse' and 'convo' statuses, and in those cases,
  will probably be loading message details only for the conversations that are continuing, since
  convos is ordered by last-message-recency with most recent first.

### Summary of complex expiration stories

You'll note two recurring words below: 'assignment' and 'contact'. While at the heart of Spoke,
these items have the greatest complexity for when to update.

* `campaign-contact` (1 day after last message, starting at campaign start):
  All contacts are loaded at once into the cache at campaign start, to 'prime' the cache for
  the texters. However, note that the campaign-contact metadata itself is only needed as
  a texter gets within 10 contacts of the contact -- all the counts and ids will be acquired
  by assignmentContacts id/message_status/timezone cache.

  Another contact-related key indexing by cell (`cell-${cell}-$messageServiceSid}`) is only updated
  on first-text. Before that, another ongoing campaign may be interacting with the contact and
  shouldn't be interrupted until this campaign actually begins.

* `assignment` (campaign deadline + 24 hours): Assignments need to be loaded at the start of the campaign.
  - update assignment cache until 'deadline'
  - when someone joins an org + active campaign

#### Assumed out-of-date objects

While all of the above cache objects will be updated 'live', there are two cache objects that
contain denormalized info, which we 'add' to, but it is too difficult/complex to 'search' and
remove when the data is out-of-date.  In these cases, these objects need to 'check' that
their items are still valid -- the same way that optOut is loaded with campaignContact to check
the current status.

In these cases, we need to verify:
 - That the user still has the assignment (lookup the assignment, and check that the user_id matches)
 - That the campaignContact record matches the assignment

* `assignmentContacts`
* `userAssignments`: by-user? but assumed to be 'out-of-date' and should only be used
  if the assignment can be loaded from cache as well
  - when someone joins an org + active campaign

## Dynamic Assignment

Dynamic assignment in campaigns is particularly tricky in caching, because we want to give contact
assignments out as fast as possible, but if someone suddenly stops texting, we don't want them to 'keep'
the abandoned contacts after they've been interrupted or stopped texting.  Somehow the 'offered'
contacts need to be able to be 'reclaimed' (at least after some duration).

The proposed architecture has a few phases.

1. Campaigns started in dynamic assignment mode will have a long queue of contactIds that can be
   'popped' off the list.  At that stage, a texter's browser has loaded, say 10 contactIds, which
   the texter will then send initial texts for.

   Thus we have one big LIST `dynamic-<campaignId>` which we can use LPOP on to assign new
   contacts to working texters.

2. We want to make sure that a texter can't 'get more' assignments until they've actually handled
   at least most of the ones in the previous batch, so when the texter gets
   new contacts, we push the contact to a SORTED SET `inflight-<campaignId>` with the contactId
   as the key and the score is the texterId.

   Before feeding someone more contacts, we make sure that they have less than N (~5 or 10)
   'in flight'.  As part of Step (1), we also add the contacts to this queue.

3.

