# Howto Scale Spoke: A Development Planning Doc

This document is aspirational and outlines a plan to improve spoke scaling.
It should be read as an "RFC"-type proposal document, that, if accepted,
should also outline the development plan even during intermediate stages
of implementation, and then hopefully, morph into architecture documentation.

## The Scaling Goal

Spoke should be able to scale to 10s of thousands of synchronous/simulataneous
texters and 10s of millions of contacts.

## Current known bottlenecks

* The database and API requests currently (2/2018) scales to around a 100 simultaneous
  texters and thousands of contacts.
* Uploading contacts is per-campaign and needs to scale to much larger files and campaigns.
  Should we consider contacts being organized at an 'organization' level, rather than per-campaign?
  This would reduce database size across many campaigns.  On the other hand, perhaps a system
  could clear out archived campaign data, and we should just facilitate that better.

## Additional possible bottlenecks

* Auth0 may not scale to 10s of thousands of contacts, and api validation requests
  on each call seem like a likely bottleneck just at the outside-request level
* Twilio is likely to scale much better than our system, but at the millions of
  contacts, there may be issues or API-quotas that might be hit.  We should consider
  better supporting [Twilio's own suggestions on how to scale high volume](https://www.twilio.com/blog/2017/07/handling-high-volume-inbound-sms-and-webhooks-with-twilio-functions-and-amazon-sqs.html)

## Optimizing the Message-Response Cycle

The message-response cycle is the most important thing to optimize -- texters sending out
messages initially, and then 


### Client-side optimization

Currently in [containers/AssignmentTexterContact.jsx](https://github.com/MoveOnOrg/Spoke/blob/main/src/containers/AssignmentTexterContact.jsx),
each contact screen loads an individual contact's information and then calls an api again for the next screen.  This is
incredibly inefficient and instead an asynchronous process in the 
[containers/TexterTodo.jsx](https://github.com/MoveOnOrg/Spoke/blob/main/src/containers/TexterTodo.jsx) component should gather
X contacts in sufficient quantity to feed it to the `AssignmentTexterContact.jsx` component as fast as it processes the data.

### Server-side optimization

To remove the database as a bottleneck we plan to introduce an optional Redis caching layer for all jobs that
are part of the Message-Response Cycle.  That includes:

* accessRequired -- login, and more importantly access control for all the texter API calls
* getNew -- all assigned contacts (w/ info) for a texter that have no message-thread yet and have status=needsMessage
* getReplies -- all assigned contacts (w/ info) who have replies to be responded to -- status=needsResponse
* incomingMessage -- the Twilio API call to update a contact's message thread and update status=needsResponse
* sendMessage -- the API call from the texter to send a message to the contact (and update the status and message thread)
* updateQuestionResponses -- the API call from texter to update the questionResponseValues of the contact
* updateAssignments -- changes from the campaign admins to assign texters
* dynamicAssignment -- for dyanmic assignment-enabled campaigns, allowing a texter to 'take' a queue of contacts for assignment and begin sending.

#### Redis Data-structures

Besides satisfying the above data needs/write-workflows, keys should expire
naturally when texters disengage (or go to bed :-)

Here is the (proposed) structure of data in Redis to support the above data needs (c_id is "contact id"):

* HASH: `texterinfo-<texter_id>` (access

  Keys: {auth0_id, [roles] (?one key per-assumable-role?), is_superadmin, [orgs] (?one key per-org?)}

* HASH: `replies-<texter_id>`

  Keys are the incoming message_id, with values with serialized (?JSON) content: {contact_cell, c_id}

* QUEUE: `conversation-<contact_cell>` -- the list of messages for a contact, both sent and received

* HASH: `contactinfo-<contact_cell>`

  Keys with values include {assigned texter_id, assignment_id, org_id, [contact info including, e.g. city/state]}

* QUEUE: `newassignments-<texter_id>` -- full contact info for all new assignments (status=needsMessage)

* QUEUE: `dynamicassignments-<campaign_id>` -- full contact info for all contacts ready for dynamic assignment in a campaign

* QUEUE: `message-write-queue` -- central queue for message data (in `conversation` keys above) written to Redis to be synced with the database

* KEY (regular `SET` call): `campaign-<campaign_id>` -- campaign data that is loaded in TexterTodo and TexterTodoList components

#### Workflows using Data-structures

* Access Control

  1. Load from `texterinfo-<texter-id>`

* getNew (needsMessage)

  1. Load (and LPOP) from `newassignments-<texter_id>`

* getReplies (needsRepsonse)

  1. Load from `replies-<texter_id>`
  2. For each contact, load `contactinfo-<contact_cell>`

* incomingMessage

  1. Load `contactinfo-<contact_cell>` to lookup the texter id assigned the contact
  2. LPUSH `conversation-<contact_cell>`
  3. LPUSH `message-write-queue`
  4. HSET `replies-<texter_id>` (using lookup)

* sendMessage

  1. LPUSH `conversation-<contact_cell>`
  2. LPUSH `message-write-queue`

* updateQuestionResponses

  1. HSET `contactinfo-<contact_id>`

* updateAssignments

  1. Either LPUSH `newassignments-<texter_id>` OR `dynamicassignments-<campaign_id>`

* dynamicAssignment (when the texter requests more assignments)

  1. LPOP `dynamicassignments-<campaign_id>`
  2. HSET `contactinfo-<contact_cell>`

