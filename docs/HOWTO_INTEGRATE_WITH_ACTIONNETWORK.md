# How to Integrate with ActionNetwork

The ActionNetwork action handler allows answer in interaction scripts to be associated
with ActionNetwork tags and event RSVPs.

## Step One - making sure your variables are set in your production/development deployment environment

- `ACTION_HANDLERS` should include `action-network`. If there are other action handlers,
they should be separated by a comma, with no spaces.
- `ACTION_NETWORK_API_KEY` should equal the API key you get from ActionNetwork

### Other environment variables you probably don't need to change

- `ACTION_NETWORK_API_DOMAIN` defaults to `https://actionnetwork.org`. 
- `ACTION_NETWORK_API_BASE_URL` defaults to `/api/v2`
- `ACTION_NETWORK_ACTION_HANDLER_CACHE_TTL` defaults to 1800

## Step Two - ensuring your contacts have an email address

- Contacts must have an email address in order to sync tags and RSVPs for them. The ActionNetwork action handler will not sync contacts that do not have an email address.

## Step Three - creating a script linked to ActionKit Event Signup

When creating an interaction script, if you want to associate an answer with an ActionNetwork RSVP, select the `Action Network` action handler, and then select one of the choices from **Answer Action Data**.
