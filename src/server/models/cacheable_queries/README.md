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

## Cached Objects

* organization
* campaign
* optOut
* cannedResponse
* user

## Code Style

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

