# Dynamic Assignment Batches Framework

Every Spoke campaign needs a method for assigning available contacts to texters. This can be done with manual or dynamic assignment. 

Dynamic assignment allows admin to use a link that once clicked gives texters access to text in the associated campaign. Texters are then able to request new texts using a request button in the dynamic assignment sidebox.

## Settings to enable and enhance dynamic assignment
- **The Dynamic Assignment Controls setting in the Texter UI Defaults panel in settings:** Needed to expose the Texter interface for using dynamic assign. This setting also allows you to choose what the text of the "request texts" button will look like.
- **The Release Contacts setting in the Texter UI Defaults panel in settings:** Allows texters to click a second button to release their texts which unassigns them from the initial texts they have left. You can also toggle a setting to allow texters to release conversations as well as initial texts. This pairs very nicely with dynamic assign, though can also be used for manual assignment.
- **`MAX_TEXTERS_PER_CAMPAIGN` Environment Variable:** Limit the number of texters allowed in a given campaign.

## Dynamic assignment strategies

By default, dynamic assignment uses the `finished-replies` strategy for deciding which texters can request batches. This allows all texters to request and receive batches. Strategy options can be found or added in `src/integrations/dynamicassignment-batches`. You can configure which strategies are active by assigning a comma separated list to the `DYNAMICASSIGNMENT_BATCHES` environment variable.

### Developing strategies

The best way to make a new dynamic assignment strategy is something like this in the codebase:

```
cd src/integrations/dynamicassignment-batches
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
