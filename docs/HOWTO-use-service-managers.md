# Service Managers Extensions

One of the core tasks in a Spoke campaign is loading in the contacts for texters to target.

One default and standard way to do so is upload a CSV with their
names, cells, zips, and custom fields. So CSV uploading (`csv-upload`) is
one of many possible (existing or not yet) ways to load contacts for a campaign.

There's a framework in Spoke that allows the System Administrator to enable additional
ways to load contacts in, as well as make it straightforward to for developers to
integrate into CRMs (Constituent Relationship Management systems) or other software/databases.

## Enabling Service Managers

Service managers enabled by an organization in the system are managed by the
environment variable `SERVICE_MANAGERS` (or in the JSON column `organization.features` for a particular organization).
Unset, the default includes nothing.
The value should be the list of enabled contact loaders separated by `,` (commas)
without any spaces before or after the comma. E.g. One to enable testing would be `SERVICE_MANAGERS=test-fake-example,scrub-bad-mobilenums`

Service managers often have consequences for your service-vendor -- i.e. they can incur costs or
affect how your system works.  It's important to understand what a particular service manager does
before enabling it -- that is both the power and the risk of these extensions.

## Included Service Managers

### per-campaign-messageservices

This service manager is intended for Twilio -- twilio restricts the numbers available to a
particular message service in your account, so this creates a new message service per-campaign.
It supports managing moving numbers to/from the general phone numbers bought
(requires PHONE_INVENTORY=1) before a campaign starts, and then after archiving the campaign,
you can (and should) release those numbers back to the general pool.

Previously this functionality was 'built in' when EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS was set.
That setting is no longer supported and you should enable this service manager instead.

### scrub-bad-mobilenums

COSTS: service vendors charge for this -- lookup their "lookup api" pricing.

This service manager blocks campaign start until one presses a Scrub numbers button in the
Service Managers campaign edit section. Clicking the button triggers lookups of all numbers
uploaded looking for numbers that cannot be texted (e.g. landlines). It then removes those
from the contacts for that campaign.

This scrubbing data is also remembered for future campaigns, so new uploads for the same numbers
won't incur the same cost and only truly new numbers will be looked up.

### numpicker-basic

Must be enabled for Bandwidth.com -- Bandwidth does not support automatic number selection like
Twilio's message service system does.  numpicker-basic rotates bought numbers to send to contacts.
It complements well with sticky-sender (below) which remembers which number was used the last time
a contact was sent.  This is the most *basic* numpicker -- we expect that future service managers
will have more sophisticated algorithms which take into account past success with phone numbers
maybe depending on the carrier per-contact.

### sticky-sender
Creates permanent mappings between contact numbers and user numbers per organization when a recipient is texted. Once the mapping exists, that contact number will always be texted by that user number. This also means that messaging services will be skipped in favor of the direct user number.  

### test-fake-example

Use this to test and understand all the hooks available to service-managers. If you
are developing a service manager, this is a good directory to copy and then edit/remove
the parts you don't need and implement your service manager.

### carrier-lookup

EXPERIMENTAL: carrier-lookup will lookup the carrier of a contact after receiving a delivery report.
At the moment, we recommend only turning this on using Bandwidth.com since carrier info on
delivery reports is free for that vendor.  Twilio charges for all carrier lookups and this would be
expensive as it's per-message -- not even per-contact.  If you are using Twilio, consider `scrub-bad-mobilenums` which does lookups before starting a campaign.


## Developing Service Managers

The best way to make a new service manager is something like this in the codebase:

```
cd src/extensions/service-managers
cp -rp test-fake-example <NEW_SERVICE_MANAGER_NAME>
```

Then edit the two files (index.js and react-component.js) in that directory.

Service managers implement common functions that are called and used in different parts of the application.

### What to implement

The first, `index.js` is the backend -- You'll need to change the exported `name` value
and then implement each of the functions included or delete them.  All functions besides `metadata()`
are optional and you should delete them if not used -- some, merely by existing can incur a
performance cost on Spoke.

Here are the hooks available

- `metadata()` -- REQUIRED: return displayName, description, and several other variables. displayName and description may be presented to the administrators.  supportsOrgConfig and supportsCampaignConfig are
  also required keys and will correspond with implementations in react-component.js
- `onMessageSend({ message, contact, organization, campaign})` -- called just before a message
   is sent from a message vendor. `message` can be changed in-place. Returned values can include
   useful values for the service *vendor* to consume, e.g. user_number and/or messageservice_sid
   which will be updated on the message.  Make sure any value you return is actually used by
   the service vendor(s) you need to support -- they do not need to heed this data.
- `onDeliveryReport({ contactNumber, userNumber, messageSid, service, messageServiceSid, newStatus, errorCode, organization, campaignContact, lookup })` -- when a message service receives a delivery
   report.  Not all these variables are reliably present -- again, it depends on the service vendor.
   This function, simply by existing, can add a performance cost since organization and other variables
   need to be looked up to call it.
- `onOptOut({ organization, contact, campaign, user, noReply, reason, assignmentId })` -- triggered
   on opt-outs.
   This function, simply by existing, can add a performance cost since organization and other variables
   need to be looked up to call it.
- `getCampaignData({ organization, campaign, user, loaders, fromCampaignStatsPage })` -- from
   a campaign admin edit or stats page, this is called. When it's the stats page, fromCampaignStatsPage=true.
   When implemented, this should return a dict with JSON data in `data` key.
   For the admin edit page , `fullyConfigured` should be false to block campaign start -- null or true otherwise.
   For the stats page after the campaign is archived , `unArchiveable` should be false to block un-archiving
   (e.g. for per-campaign-messageservice, after releasing phone numbers the campaign cannot be unarchived).
- `onCampaignUpdateSignal({ organization, campaign, user, updateData, fromCampaignStatsPage})` -- 
   this complements getCampaignData -- when react-component.js implements `CampaignConfig` or `CampaignStats`
   then the onSubmit call can send updateData which will be passed back through to this method. You
   can process this data and return updates to data, fullyConfigured, and unArchiveable which will re-update
   the front-end interface.
- `getOrganizationData({ organization, user, loaders})` -- the same as getCampaignData, but for the
  organization Settings config in admin
- `onOrganizationUpdateSignal({ organization, user, updateData })` -- the complement to onCampaignUpdateSignal but for the organization Settings config page and `OrgConfig` react-component.js exported object.
- `onCampaignContactLoad()` -- (see test-fake-example for args) -- triggered after a campaign's
  contacts have been successfully uploaded -- this can scrub (or add) contacts further or make other changes.
- `onOrganizationServiceVendorSetup()` -- (see test-fake-example for args) -- triggered after
  a service-vendor is configured in Settings.
- `onCampaignStart({ organization, campaign, user })` -- triggered when a campaign has been
  successfully started.
- `onCampaignArchive({})` -- triggered when a campaign has been archived
- `onCampaignUnArchive({})` -- triggered when a campaign has been unarchived


Then you may want to implement `react-component.js`. In here you can export several react components
that are used in different contexts.  See test-fake-example for examples.  You can implement and export:
- `OrgConfig` -- added to the Settings page and will receive and send data from/to your index.js getOrganizationData and onOrganizationUpdateSignal respectively.
- `CampaignConfig` -- shown in Campaign admin edit section
- `CampaignStats` -- show at the top of the Campaign admin stats page if implemented (and does not render to null)

