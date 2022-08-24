# Texter Sideboxes

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


## Included Texter Sideboxes

Texter sideboxes that begin with `default-` are enabled by default -- a campaign or organization
can still explicitly turn them off.  Others need to be opt-in per-organization (as a default) or
per-campaign.

### default-dynamicassignment

This sidebox is the basic functionality for dynamic assignment prompting the texter to request
their first (and later) batches of texts.

All buttons/labels are configurable -- have some fun and bring delight to your texters by
personalizing the messages/tone.

For developers, this is a good demonstration of the power of texter-sideboxes -- the entire
frontend dynamic assignment workflow is through this texter-sidebox and `default-releasecontacts`
sidebox.

### default-releasecontacts

The complementary component but separately enableable/disableable from `default-dynamicassignment`,
when enabled, texters can release their contacts back to the unassigned pool -- i.e. "Done for the day"
A configuration option allows you to enable this even for non-dynamic-assignment campaigns.

### default-editinitial

By default, texters can edit the initial messages per-campaign.  This sidebox obscures that capability
to make texters more intentional about changing messaging with a campaign strongly recommends
sticking to.

See [Best Practices on Conformance and Messaging](./REFERENCE-best-practices-conformance-messaging.md#modifying-the-initial-text-message)

### celebration-gif

After a texter completes their batch of messages show them a celebratory animated gif and message
that pops up.  We recommend trying this out and limiting the size of the gif to work on mobile, etc.

Developers might want to take a look at this texter-sidebox for an example of a "popup" implementation,
where even on mobile, the texter won't miss the texter-sidebox context (of course, use sparingly!)

### contact-reference

We suggest enabling this but it is not on by default.  With this enabled, texters will see a link reference
where they can copy it and share with a campaign admin to visit the relevant conversation.  Texters
can use it themselves to keep a specific conversation in a browser window to refer to later.

### freshworks-widget

If your campaign has an account with freshdesk/freshworks, you can enable their [help widget](https://freshdesk.com/customer-engagement/help-widget) for texters to ask for help from the sidebox.

### hide-media

Enabled this hides contact images and video sent back to texters in replies which can have offensive content.

### mobilize-event-shifter

Mobilize (America) event scheduling. User clicks the button and the MOBILIZE_EVENT_SHIFTER_URL opens up in a Dialog as an iframe, which is meant to be an organization's main event list. If contact has a zip, it is included to filter the mobilize events. If the campaign contacts include an event_id column in the CSV, or provides a default event id for the campaign/organization, it adds a tab for the mobilize event in an iframe and prefills the first name, last name, cell, email, and zip into the fields via the query string. Texter can then switch between tabs of the specific event or the general event list. [Pull request with screenshots](https://github.com/MoveOnOrg/Spoke/pull/1812)

Note: as of 3/1/21 you will need to reach out to Mobilize support to have them enable embedding for your dashboard(s), otherwise you'll probably get the error `Refused to display '{MOBILIZE_EVENT_SHIFTER_URL}' in a frame because it set 'X-Frame-Options' to 'sameorigin'.`

### per-campaign-bulk-send

This texter sidebox allows you to enable or disable bulk send per campaign. To use this texter sidebox, bulk send must be enabled in your Spoke instance.

### tag-contact

If you create tags related to 'escalation' or something you want texters to be able to mark
on a texter (e.g. "Spanish-Speaking" or "Hot lead", etc), set the group of the tag to "texter-tags"
and enable this sidebox, and during replies texters can save these tags.  You will be able to 'resolve'
them in the Message Review panel.

### take-conversations

If you enable in the `release-contacts` texter sidebox for texters to 'give up their conversations'
(i.e. not just their initial messages but the conversations for replies, as well), then enabling this
widget will allow texters that are marked as "Vetted Texters" (or a higher role) to pull
conversations as a batch just like default-dynamicassignment pulls batches .

In order for this to work, the dynamicassignment-batches handler `vetted-takeconversations` needs to be
installed by the system (DYNAMICASSIGNMENT_BATCHES=....,vetted-takeconversations) and in the Dynamic Assignment
section of your campaign after choosing the batch rule for initial texters, Ctrl-click "vetted-takeconversations"
to add it.  If you create a different custom dynamicassignment-batches extension that allows taking
non-initial contact (needsMessage), you can also use that one by setting that batch rule in the
`take-conversations`'s Texter UI settings.

Combined, these extensions allow 'split' assignment -- a different group to send initial texts than to
handle replies.

### texter-feedback

Must be enabled for Admins to be able to review contacts' replies and give feedback.  To customize the
variables feedback is given dump valid JSON blob based on this [Working Families Party example](https://github.com/MoveOnOrg/Spoke/blob/stage-main-10-c/src/extensions/texter-sideboxes/texter-feedback/config-wfp-example.json)
into the custom field. Note that invalid JSON will break Spoke!


## Texter Sidebox configuration options

All texter-sideboxes that *can* be enabled in organizations must be included in the
global environment variable TEXTER_SIDEBOXES= (though not setting it at all will
enable the sideboxes we consider fully production-ready).


## Demoing/Testing sideboxes

While either developing or for demo purposes, you can visit the following urls
on your running Spoke instance to see texter sideboxes (or just the texter view)
for certain contexts:

* `/demo/text` (for initial texting context)
* `/demo/reply` (for first replies)
* `/demo/reply2` (for an example with a deeper conversation)
* `/demo/dyn` (for a dynamic assignment example after completing texting)


## Developing Texter Sideboxes

The best way to make a new texter sidebox is to copy an existing one and then edit:

```
cd src/extensions/texter-sideboxes
cp -rp celebration-gif <NEW_NAME>
```

Then edit react-component.js in that directory.

If you have a simple sidebox that is just displaying text, copy `default-editinitial`.
If you are implementing something that pops up on mobile (like an alert()) look at
`celebration-gif`. If you are making a sidebox that load or send graphql
queries/mutations, then take a look at `default-dynamicassignment` -- though note
that it collapses views that display both to the Todos summary screen AND the texter
view.

### API components for Texter sideboxes

Export methods/objects with these names from your react-component.js:

* `function displayName()`
  required for all sideboxes return a string with the sidebox title shown to campaign admins.
* `function showSidebox()`
  when returning a truthy value the sidebox defined as `TexterSideboxClass` will be rendered.
  Return `"popup"` if it should popup to interrupt the texter mobile view.
  * Arguments:
  ```
  showSidebox({
    settingsData,
    campaign, assignment, contact,
    currentUser,
    texter,
    navigationToolbarChildren
    messageStatusFilter
    finished
    loading
  })
  ```
  Most arguments have the context from the graphql loaded from the containers/TexterTodo.jsx
  component.
  * `settingsData` will include the properties defined by `adminSchema` and set from the
    AdminConfig component (both below)
  * `texter` and `currentUser` don't always have to be the same -- check permissions
    with `currentUser.roles`;
  * `finished` is for contexts where a texting task context is completed
    (e.g. sending initials or sending all the replies)
  * `messageStatusFilter` will be the filter in routes.jsx -- e.g. `needsMessage` for initial texting
  * `contact` is null in the context where there are no (remaining) contacts
    to reply/send to in a certain context.
  * `navigationToolbarChildren` have data passed into the AssignmentTexter/Controls.jsx
    component with next/prev total values and strings to drive the contact toolbar's
    navigation.

* `TexterSideboxClass`:React.Component object passed with the same properties
  sent to `showSummary`.

* `function showSummary()` if it returns true, the `SummaryComponent` will be rendered
  in the texter's Todos campaign summary section (under any buttons).
  * Arguments:
  ```
  showSummary({
    isSummary: true
    settingsData
    campaign
    assignment
    texter
  })
  ```
  isSummary is always true.  Arguments have the data loaded from containers/TexterTodoList.jsx.
  `settingsData` will include the properties defined by `adminSchema` and set from the
  AdminConfig component (both below)

* `SummaryComponent`:React.Component object passed with the same properties
  sent to `showSummary`.

* `function adminSchema()` required function that returns a `yup` schema dict
  with names and types that will be configurable in `AdminConfig` and saved
  to the organization (as defaults) and per-campaign (in campaign.features column).
  Then the data is passed as an argument as `settingsData` to the methods above for
  rendering.

* `AdminConfig`:React.Component - admin component rendered to administrators
  after they've enabled your component with a toggle.  This should provide
  both *documentation* about the texter-sidebox and *config* Form.Field(s)
  * Props:
    * `settingsData` -- the current values set from previous loads
    * `onToggle: function(name, val)` - a method that can trigger a true/false value that will update `name` with `val` if you are not using Form.Field(s).
