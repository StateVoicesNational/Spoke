# Service Vendors Handlers

For Spoke to send and receive text messages we need to connect to a vendor that has an API
to send/receive SMS/MMS!  Historically, Spoke has worked with Twilio.com. Service Vendors
abstract this to support other vendors.  There is an experimental Bandwidth.com implementation,
and we hope/expect others to follow.

Implementations should set DEFAULT_SERVICE=twilio or the vendor service being used.
This can also be set in a Spoke organization's `features` column as JSON (e.g. `{"DEFAULT_SERVICE": "twilio"}`).

## Service Vendor configuration options

Service Vendor implementations should and do accept global environment variable (or organization features settings) values.
However, there is also an implementation in each one where account settings can be configured in the
*Settings* tab in the organization admin panel (organization OWNER permissions are required).

## Included Service Vendors

### twilio

The default production service-vendor.  Set DEFAULT_SERVICE=twilio -- configuration can be done in
Settings organization tab if TWILIO_MULTI_ORG=1.

Alternatively, if you want the same creds for all organizations, then set
the variables TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGE_SERVICE_SID.

See more at [How to integrate Twilio](HOWTO_INTEGRATE_TWILIO.md)

### fakeservice (for development/testing)

We recommend using this implementation during development/testing so you don't need to
create an account or pay for 'real messages' to be sent. DEFAULT_SERVICE=fakeservice
supports many aspects like phone number buying, sending messages, replies (any message
sent with the text "autorespond" in it, will automatically receive a reply) -- all fake,
but this helps with dev/testing features supported in Twilio, Bandwidth and other service-vendors.

### bandwidth

See [How to integrate Bandwidth](HOWTO_INTEGRATE_BANDWIDTH.md)

### nexmo (broken, unknown status)

Nexmo support existed when MoveOn officially adopted the project in 2017 but
has never been used -- very little work/attention has been done to maintain this implementation.
It likely needs some development to bring support in, which we would encourage and can help
with, but have no plans to do so.

## Developing Service Vendors

The best way to make a new message handler is something like this in the codebase:

```
cd src/extensions/service-vendors
cp -rp fakeservice <NEW_NAME>
```

Then edit index.js in that directory.


### API properties for message handlers

Export methods/constants with these names from your index.js

#### Required functions

- `getMetadata()` -- must return dict with `name` and `supportsOrgConfig` boolean
- `sendMessage({ message, contact, trx, organization, campaign, serviceManagerData })` -- sends a message.
  At this point, the `message` record has been saved, likely with send_status="SENDING".
  Message service onMessageSend() hooks have also been called and any returned info has been compiled into
  serviceManagerData. trx value will be non-null/empty if the message is being sent inside a SQL transaction.
- `errorDescriptions<Object>` should be an exported object with error number keys and strings as
  values to what they mean.
- `errorDescription(errorCode)` - should return an object with code, description, link keys with the latter
  being a link to public api documentation on what the error is/means from the vendor service.
- `addServerEndpoints(addPostRoute)` - call addPostRoute(expressRouteString, func1, ....) which is
  passed to express app.post() arguments -- this is important for handling receiving messages and delivery reports.
- `handleIncomingMessage(message)` -- not technically required but likely a method you should implement
  so that it's
- `fullyConfigured(organization, serviceManagerData)` - should return a boolean on whether the
  service is ready to support texting. serviceManagerData is the result of service managers that are
  enabled and have implemented onOrganizationServiceVendorSetup()
  
#### functions for PHONE_INVENTORY support

- `buyNumbersInAreaCode(organization, areaCode, limit)`
- `deleteNumbersInAreaCode(organization, areaCode)`
- `addNumbersToMessagingService()`
- `clearMessagingServicePhones()`

#### methods to support org config/setup

- `getServiceConfig({ serviceConfig, organization, options = { obscureSensitiveInformation, restrictToOrgFeatures } })` - returns a JSONable object that is passed to your react-component.js in Settings for service vendor section. Be careful to return fake/obscured info when options.obscureSensitiveInformation=true (e.g. `<Encrypted>` Where possible, you should use getSecret and convertSecret from secret-manager extensions.
- `updateConfig(oldConfig, config, organization, serviceManagerData)` -- called when onSubmit is called
  from your react-component.js org config component -- this should save data into organization. Where possible,
  you should use getSecret and convertSecret from extensions/secret-manager so that secrets can be encrypted
  or stored in a secrets backend system.

#### methods for message services

If your vendor has a concept of a 'messaging service' then implement these:

- `getMessageServiceSid(organization, contact, messageText)` -- can return a message service
  value based on organization and contact


#### Contact lookup methods

For both of these they should return values that must include `contact_number`, `organization_id`, and `service` (name, e.g. "twilio"). Other values should only be included in the result if they should override any existing data in organization_contact table.

The key `status_code` should be 0 or positive if the number is textable. It should be negative if it is not
textable. Specifically, -1 for landlines, -2 for a non-existent/unserviced number, -3 for a bad country code match from PHONE_NUMBER_COUNTRY if that is set.  Add other negative (or positive) values if useful to distinguish them.

- `getContactInfo({ organization, contactNumber, lookupName })` - if the vendor service has
  a way to reverse lookup phone number data like carrier and name, then this is how to do it.
- `getFreeContactInfo()` - same args as above -- this indicates that info can be looked up for
  free and will be preferred when possible and available over the former method.

