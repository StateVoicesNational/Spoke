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

* count of all texts sent by all users in all campaigns

SELECT 
  "user".id AS user_id, "user".last_name,"user".first_name,COUNT (message.id) AS message_sent_count
FROM 
  public.assignment,public."user",public.message
WHERE 
  assignment.user_id = "user".id AND
  assignment.id = message.assignment_id AND
  message.is_from_contact = 'f' 
GROUP BY
"user".id
ORDER BY
  message_sent_count DESC;
  
  
  * count of all texts sent by all users in one campaign
  
  
  SELECT 
  "user".id AS user_id, "user".last_name,"user".first_name, COUNT (message.id) AS message_sent_count
FROM 
  public.assignment, 
  public."user", 
  public.message
WHERE 
  assignment.user_id = "user".id AND
  assignment.id = message.assignment_id AND
  assignment.campaign_id = 30 AND 
  message.is_from_contact = 'f'
GROUP BY
"user".id
ORDER BY
  message_sent_count DESC;


*TO DO (wish list) of some useful SQL query examples, for creating redash dashboard reports:

* survey question response counts and percentage of total responses to survey question

* count of contacts, texters, sent, count (and as percent of total sent) of replies, optouts and wrong numbers, for all campaigns
