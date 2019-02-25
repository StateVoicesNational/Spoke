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

`SELECT COUNT (distinct a.user_id)
FROM message m
JOIN assignment a
ON m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = true;
`

* count of unique contacts texted in the past hour

`SELECT COUNT (distinct m.contact_number)
FROM message m
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = false;
`

* count of unique contacts responding in the past hour

`SELECT COUNT (distinct m.contact_number)
FROM message m
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = true;
`

* query that pulls all the data for the above queries at once so you can process in code if necessary

`SELECT a.user_id as texter_id, m.contact_number, m.is_from_contact
FROM message m
JOIN assignment a
ON  m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour';
`

* count of all texts sent by all users in all campaigns

`SELECT 
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
  `
  
  
  * count of all texts sent by all users in one campaign
  
 `SELECT 
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
`

* counts of texters, sent, responses, reply rate, total texts, opt outs, opt out rate and estimated cost for all current campaigns
`SELECT
    c.id AS camp_id,
    c.title AS title,
    c.organization_id AS org,
    texters::int,
    texts_sent::int,
    replies::dec,
    (replies::decimal / texts_sent)  AS reply_rate,
    total_texts::dec,
    opt_outs::int,
    (opt_outs::decimal / texts_sent)  AS opt_out_rate,
    /* cost per texter = $1 / 30 days (est), total_texts at .015 assumes typical text is two 'message segments', see https://www.twilio.com/blog/2017/03/what-the-heck-is-a-segment.html#segment  */
    round(((texters / 30) + ((total_texts * .015)*1.15)), 2) AS costid
    
FROM wfp_spoke.campaign AS c

INNER JOIN wfp_spoke.organization AS o ON o.id = c.organization_id

INNER JOIN (
    SELECT
        campaign_id,
        COUNT (DISTINCT m.assignment_id) AS texters,
        COUNT(DISTINCT (
          CASE WHEN m.is_from_contact = 'false' THEN m.id END
        )) AS texts_sent,
        COUNT(DISTINCT (
          CASE WHEN m.is_from_contact = 'true' THEN m.id END
        )) AS replies,
        COUNT(DISTINCT m.id) AS total_texts,
        COUNT(DISTINCT o.id) AS opt_outs
    FROM wfp_spoke.assignment a
    INNER JOIN wfp_spoke.message m ON m.assignment_id = a.id
    LEFT JOIN wfp_spoke.opt_out o ON o.assignment_id = a.id
    GROUP BY 1)
AS m ON m.campaign_id = c.id
WHERE campaign_id >= 0
ORDER BY 1,2
`


*TO DO (wish list) of some useful SQL query examples, for creating redash dashboard reports:

`survey question response counts and percentage of total responses to survey question
`

`count of contacts, texters, sent, count (and as percent of total sent) of replies, optouts and wrong numbers, for all campaigns
`
