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
messages initially, and then handling replies and knowing when there are new replies to handle.


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

#### DB write queue

While the Redis cache layer will suffice for the real-time read/write
interface during high traffic, we still want to ensure that the DB is
eventually synchronized.  This should be done with a message queue
that synchronizes the database (eventually).  Making this separate
from Redis will allow for fault tolerance, but also adds an additional
technology to be integrated and maintained.  This work may align with
other interest in making the existing Spoke job queue (to handle,
e.g. texter assignment, contact uploads) -- but might not?

Some technologies that could support this:
* Amazon SQS
* Heroku AMQP: https://elements.heroku.com/addons/cloudamqp
* Should we have a 'backup option' that is 'pure redis' so folks can use that optionally?



#### Redis Data-structures

Besides satisfying the above data needs/write-workflows, keys should expire
naturally when texters disengage (or go to bed :-)

Here is the (proposed) structure of data in Redis to support the above data needs (c_id is "contact id" and `message_service_id` is probably global, but maybe related to the organization in a multi-tenant configuration):

* HASH: `texterinfo-<texter_id>` (access

  Keys: {auth0_id, `<org_id>`=`<role>`, is_superadmin}

* HASH: `replies-<texter_id>-<campaign_id>`

  Keys are the incoming message_id, with values with serialized (?JSON) content: {contact_cell, c_id}

* QUEUE: `conversation-<contact_cell>-<message_service_id>` -- the list of messages for a contact, both sent and received

* HASH: `contactinfo-<contact_cell>-<message_service_id>`

  Keys with values include {assigned texter_id, assignment_id, org_id, questionResponseValues, [contact info including, e.g. city/state]}

* QUEUE: `newassignments-<texter_id>-<campaign_id>` -- full contact info for all new assignments (status=needsMessage)

* HASH: `unsentassigned-<texter_id>-<campaign_id>`

  Keys are `<contact_cell>`; values are full contact info and assignment id/status
  (same as values in `newassignments-<texter_id>-<campaign_id>` above)

  The use-case that unsentassigned- helps us with is imagine the following situation:

  1. Some things are in newassignments
  2. A texter's browser sends the query to get some new assignments. So the system sends them some items from newassignments and removes them from newassignments (so that future queries won't re-send the same ones)
  3. The texter leaves, a network failure occurs, or the texter's browser crashes.
  4. Finally later the texter logs in again to resume. Their browser does more queries to newassignments, and they finish their task

  The problem here is that those middle contacts got dropped. By storing unsentassigned, we track which ones are 'in the queue' -- i.e. sent to the texter, but the texter has not yet actually sent them a message/response. Thus we only want to fully remove them after the texter sends them a response. Until then, they're in 'purgatory'--i.e. we'll skip them until the texter thinks they're finished.


* QUEUE: `dynamicassignments-<campaign_id>` -- full contact info for all contacts ready for dynamic assignment in a campaign

* KEY (regular `SET` call): `campaign-<campaign_id>` -- campaign data that is loaded in TexterTodo and TexterTodoList components

#### Workflows using Data-structures

##### Access Control

  1. Load from `texterinfo-<texter-id>`

##### getContacts - [backend code](https://github.com/MoveOnOrg/Spoke/blob/main/src/server/api/assignment.js#L107) - [frontend code](https://github.com/MoveOnOrg/Spoke/blob/main/src/containers/TexterTodo.jsx#L67)

* dynamicAssignment (when the texter requests more assignments)

  1. LPOP `dynamicassignments-<campaign_id>`
  2. HSET `contactinfo-<contact_cell>-<message_service_id>`

* getNew (needsMessage)

  1. Load (and LPOP) from `newassignments-<texter_id>-<campaign_id>`
  2. If newassignments is empty, we check `unsentassigned-<texter_id>-<campaign_id>` for content.  If it does, we ?resend that data with an additional setting in the API getNew so the client knows that the 'original queue' is empty.
  3. (if not empty) HSET `unsentassigned-<texter_id>-<campaign_id>` `<contact_cell>` [the assignment data]

* getReplies (needsRepsonse)

  1. Load from `replies-<texter_id>`
  2. For each contact, load `contactinfo-<contact_cell>-<message_service_id>`

##### incomingMessage

  1. Load `contactinfo-<contact_cell>-<message_service_id>` to lookup the texter id assigned the contact
  2. LPUSH `conversation-<contact_cell>-<message_service_id>`
  3. LPUSH `message-write-queue`
  4. HSET `replies-<texter_id>` (using lookup)

##### sendMessage

  1. If status is needsMessage then confirm that it's the first item in `conversation-<contact_cell>-<message_service_id>`, otherwise, do not (re)send message.
  2. LPUSH `conversation-<contact_cell>-<message_service_id>`
  3. LPUSH `message-write-queue`

##### updateQuestionResponses

  1. HSET `contactinfo-<contact_cell>-<message_service_id>`

##### updateAssignments

  1. Either LPUSH `newassignments-<texter_id>-<campaign_id>` OR `dynamicassignments-<campaign_id>`


#### Initial loading into cache

Starting from t0, when everything is in the database, how does data end up
in the cache, and when can we confidently use it?

* Initial assignments in a redis-enabled context should all load into
  redis at the moment of *starting the campaign* along with contactinfo.  Campaign keys should
  expire when the campaign is set to expire.
* Texter info should load on login and expire after ?2 days (with another login
  pushing expiration out)
* Conversations/Replies should expire in X days
  (maybe when campaign ends, or maybe just 2 days and reset on update)

#### Multi-tenant considerations

For instances with multiple organizations, it's worth imagining how we should
scale across larger instances.  The main thing that needs to be 'known' for, e.g.
sharding is the instance for an organization and most-importantly a twilio account
(so that the application can lookup the right info per-twilio account).

