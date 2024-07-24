# Dynamic Assignment Batches Framework

Every Spoke campaign needs a method for assigning available contacts to texters. This can be done with manual or dynamic assignment. 

Dynamic assignment allows admin to use a link that once clicked gives texters access to text in the associated campaign. Texters are then able to request new texts using a request button in the dynamic assignment sidebox.

## Settings to enable and enhance dynamic assignment
- **The Dynamic Assignment Controls setting in the Texter UI Defaults panel in settings:** Needed to expose the Texter interface for using dynamic assign. This setting also allows you to choose what the text of the "request texts" button will look like.
- **The Release Contacts setting in the Texter UI Defaults panel in settings:** Allows texters to click a second button to release their texts which unassigns them from the initial texts they have left. You can also toggle a setting to allow texters to release conversations as well as initial texts. This pairs very nicely with dynamic assign, though can also be used for manual assignment.
- **`MAX_TEXTERS_PER_CAMPAIGN` Environment Variable:** Limit the number of texters allowed in a given campaign.

## Dynamic assignment strategies

You can configure which strategies are active by assigning a comma separated list to the `DYNAMICASSIGNMENT_BATCHES` environment variable.

## Included Dynamic assignment strategies

### finished-replies (default)

By default, dynamic assignment uses the `finished-replies` strategy for deciding which texters can request batches. This allows all texters to request and receive batches. Strategy options can be found or added in `src/integrations/dynamicassignment-batches`. 

### vetted-texters

An alternative strategy is for non-vetted texters to be able to only request a single batch, but to get
additional batches, only vetted texters can do so.

### all-texters

You can also have 'no requirements' -- and just let all texters (still just those invited to the
campaign with the dynamic assignment join link) send as many batches as they want.

### vetted-takeconversations

Experimental batch strategy that should NOT be used as the default, but can be used as a secondary
strategy (by Ctrl-clicking this one after you choose your default preference).  Combined with the
`take-conversations` texter sidebox this will allow Vetted texters to take convos that are
not in needsMessage but have replies/conversations.  This is useful for 'split' assignments where
one group of texters sends initial texts and then another group does the second.

Also needed for organizing split assignments would be the `outbound-unassign` message handler which
unassigns messages upon initial send (so they can be 'taken' by the vetted texters.


## Developing strategies

The best way to make a new dynamic assignment strategy is something like this in the codebase:

```
cd src/extensions/dynamicassignment-batches
cp -rp vetted-texters <NEW_STRATEGY_NAME>
```

Then edit index.js in that directory.

The section `// START WITH SOME BASE-LINE THINGS EVERY POLICY SHOULD HAVE` outlines the code block that every strategy should include:
```js
  if (!campaign.use_dynamic_assignment || campaign.is_archived) {
    return 0;
  }
  if (assignment.max_contacts === 0 || !campaign.batch_size) {
    return 0;
  }
  const availableCount = await r.getCount(
    r.knex("campaign_contact").where({
      campaign_id: campaign.id,
      message_status: "needsMessage",
      assignment_id: null
    })
  );
```
the vetted-texters sample also integrates access into that section. You can add code anywhere around that foundation to build out different forms of access, or other conditions for when a texter can request texts.

### API properties for batches

Export methods/constants with these names from your index.js:

* `name`:String - *required* and must be the same as the directory name
* `function displayName()` - *required* function that returns a title that may
  be (in the future) displayed to the campaign admin during configuration.
* `async function requestNewBatchCount()` *required* and called when a texter has an opportunity
  to be prompted for another batch.  Return a the number of contacts available
  for this texter in this campaign.  Return `0` if they are not eligible.
  * You are responsible for ALL restrictions related to the request including
    the obvious ones like `campaign.is_archived`, `assignment.max_contacts==0`.
    This is so some more byzantine strategies could be written that might
    have exceptions for these.
  * Arguments
    ```
    requestNewBatch({
      organization,
      campaign,
      assignment,
      texter,
      r,
      cacheableData,
      loaders
    })
    ```
    * r, cacheableData are the models objects to do queries

* `async function selectContacts()` - optional function that can alter the default
  query when the texter calls `findNewCampaignContact`(s).
  * By default,
    contacts that are unassigned and have status `needsMessage` are loaded.
    This is a way to use strategies to override that -- e.g. of contacts that are
    already assigned or in a different status.
  * See `vetted-takeconversations` for an example and a sample use-case
    (to take unassigned contacts IN conversation that may have been dropped by another texter)
  * Arguments:
    ```
    selectContacts(batchQuery, hasCurrentQuery, { assignment, campaign, r})
    ```
    * See src/server/api/mutations/findNewCampaignContact.js for details of these arguments.
      In short you can return one or both of the `batchQuery` and `hasCurrentQuery` to
      override the existing query.
    * hasCurrentQuery: a query to determine if the texter has "too many already" before
      giving them more.
    * batchQuery: the query when the texter is eligible (through the above methods) that will
      choose the contacts (limited by the smallest of the texter's client request,
      assignment.max_contacts and the result from requestNewBatchCount) that will be
      assigned to the texter.
