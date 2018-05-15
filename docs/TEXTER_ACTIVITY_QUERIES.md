## QUERIES TO MEASURE TEXTER ACTIVITY

* count of messages sent or received in the past hour

`SELECT count(*)
FROM message
WHERE created_at > current_timestamp - interval '1 hour';
`

* count of unique senders and receivers in the past hour

`SELECT COUNT (distinct a.user_id)
FROM message m
JOIN assignment a
ON m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour';`
`
* count of unique texter senders in the past hour

`
SELECT COUNT (distinct a.user_id)
FROM message m
JOIN assignment a
ON m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = false;
`

* count of unique texter recipients in the past hour

`
SELECT COUNT (distinct a.user_id)
FROM message m
JOIN assignment a
ON m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = true;
`

* count of unique contacts texted in the past hour

`
SELECT COUNT (distinct m.contact_number)
FROM message m
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = false;
`

* count of unique contacts responding in the past hour

`
SELECT COUNT (distinct m.contact_number)
FROM message m
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = true;
`

* query that pulls all the data for the above queries at once so you can process in code if necessary

`
SELECT a.user_id as texter_id, m.contact_number, m.is_from_contact
FROM message m
JOIN assignment a
ON  m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour';
`
* query that pulls the total text message count (for all campaigns) for each texter's name

`
SELECT a.user_id, u.first_name, u.last_name, u.email, count(cc.id)
FROM spoke.assignment a
JOIN spoke.campaign_contact cc ON a.id=cc.assignment_id
LEFT JOIN spoke.user u ON a.user_id = u.id
WHERE cc.message_status != 'needsMessage'
GROUP BY a.user_id, u.first_name, u.last_name, u.email
ORDER BY count(cc.id) DESC;
`
*TO DO (wish list) of some useful SQL query examples, for creating redash dashboard reports:

* survey question response counts and percentage of total responses to survey question

* count of contacts, texters, sent, count (and as percent of total sent) of replies, optouts and wrong numbers, for all campaigns

* text count by each texter name for a particular campaign, for a 'leaderboard' of texters
