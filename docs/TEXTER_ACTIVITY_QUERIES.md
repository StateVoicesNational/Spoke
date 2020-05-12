## QUERIES TO MEASURE TEXTER ACTIVITY

- count of messages sent or received in the past hour

```sql
SELECT count(*)
FROM message
WHERE created_at > current_timestamp - interval '1 hour';
```

- count of unique senders and receivers in the past hour

```sql
SELECT COUNT (distinct a.user_id)
FROM message m
JOIN assignment a
ON m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour';
```

- count of unique texter senders in the past hour

```sql
SELECT COUNT (distinct a.user_id)
FROM message m
JOIN assignment a
ON m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = false;
```

- count of unique texter recipients in the past hour

```sql
SELECT COUNT (distinct a.user_id)
FROM message m
JOIN assignment a
ON m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = true;
```

- count of unique contacts texted in the past hour

```sql
SELECT COUNT (distinct m.contact_number)
FROM message m
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = false;
```

- count of unique contacts responding in the past hour

```sql
SELECT COUNT (distinct m.contact_number)
FROM message m
WHERE m.CREATED_AT > current_timestamp - interval '1 hour'
AND is_from_contact = true;
```

- query that pulls all the data for the above queries at once so you can process in code if necessary

```sql
SELECT a.user_id as texter_id, m.contact_number, m.is_from_contact
FROM message m
JOIN assignment a
ON  m.assignment_id = a.id
WHERE m.CREATED_AT > current_timestamp - interval '1 hour';
```

- count of all texts sent by all users in all campaigns

```sql
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
```

- count of all texts sent by all users in one campaign

```sql
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
```

- counts of texters, sent, responses, reply rate, total texts, opt outs, opt out rate and estimated cost for all current campaigns

```sql
SELECT
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
```

#### TO DO (wish list) of some useful SQL query examples, for creating redash dashboard reports:

- all responses to Initial text, excluding opt-outs, and separate out JSON data from `custom_fields`

```sql
SELECT
c.id AS campaign_id,c.title,cc.first_name AS first,substring(custom_fields from '(?:"MiddleName":")([\w\.]*)') AS MiddleName,
cc.last_name As last,substring(custom_fields from '(?:"Suffix":")([\w\.]*)') AS Suffix,
cc.cell,cc.external_id,substring(custom_fields from '(?:"external_ID":")([\d\.]*)') AS van_id,
substring(custom_fields from '(?:"DWID":")([\d\.]*)') AS dwid,cc.updated_at,texter.first_name AS texterFirst,
texter.last_name AS texterLast, qr1.value as question_response
FROM campaign_contact cc
LEFT JOIN assignment a ON (cc.assignment_id = a.id)
LEFT JOIN public.user texter ON (texter.id = a.user_id)
LEFT JOIN question_response qr1 ON  (qr1.campaign_contact_id = cc.id)
LEFT JOIN campaign c ON (c.id = cc.campaign_id)
WHERE qR1.value IS NOT NULL AND cc.is_opted_out = 'false'
AND c.id IN (23,25,28,29,30,31,32)
ORDER BY updated_at DESC;
```

- survey question response counts and percentage of total responses to survey question

* count of contacts, texters, sent, count (and as percent of total sent) of replies, optouts and wrong numbers, for all campaigns


- Count of all messages, with filter for date range, organization, campaign 

```sql
SELECT count(*)
FROM message m
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
```

- Count of contacts texted, with filter for date range, organization, campaign 

```sql
select count(distinct m.contact_number) from message m
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
```

- count of outbound messages, with filter for date range, organization, campaign 

``` sql
select count(*) from message m 
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and m.is_from_contact = false
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
```

- Count of inbound messages, with filter for date range, organization, campaign 

```sql
select count(*) from message m 
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and m.is_from_contact = true
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
```

- Count of Organization-wide opt-outs, with filter for date range, organization

```sql
select count(*) from opt_out t
join organization o
on o.ID = t.organization_ID
left join campaign c
on c.organization_ID = o.ID
where [t.created_at = daterange]
and [o.name=organization]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
```

- Count of Texters in a Campaign or Org, with filter for date range, organization, campaign 

```sql
SELECT count(distinct m.user_id) from message m
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
```

- Inbound vs Outbound Share of Messages (recommend a pie graph to visualize the tables)

```sql
select case when m.is_from_contact = true then 'Inbound' else 'Outbound' end as MessageType, count(*) from message m 
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
--left join user_organization z
--on z.user_id = m.user_id
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
group by MessageType
```

- Share of message status (pie graph visualization recommended)

```sql
select n.message_status, count(*)
from campaign_contact n
left join campaign c
on c.id = n.campaign_id
left join organization o 
on o.ID = c.organization_ID
where [c.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
group by n.message_status
```

- Send success rate (recommend pie graph visualization)

```sql 
select m.send_status, count(*) from message m
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
group by m.send_status
```

- Total Messages by Date (recommend line graph visualization with sent as x axis and messages as y axis)

```sql
select c.title as Campaign, to_char(m.sent_at :: DATE, 'yyyy-mm-dd') as Sent, count(m.ID) as Messages from message m
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and m.send_status <> 'ERROR'
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
group by campaign, sent
```

- Table of Campaigns

```sql
select o.name as Organization, c.title as Campaign, to_char(c.created_at :: DATE, 'mm/dd/yyyy') as Created, to_char(c.due_by :: DATE, 'mm/dd/yyyy') as Due from campaign c
join organization o 
on c.organization_ID = o.ID
where [o.name=Organization]
and [c.title=campaign]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
order by c.created_at desc, c.due_by desc
```

- Table of Campaign Questions

```sql
select distinct i.question as Questions from interaction_step i
left join campaign c
on c.ID = i.campaign_id
left join organization o 
on c.organization_ID = o.ID
where i.question <> ''
and 
[c.title=Campaign]
and 
[o.name=organization]
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
```

- Table of Questions and Answers

```sql
select 
--n.external_ID as VANID,
--m.contact_number as Phone,
i.question as Question, 
q.value as Response, 
count(*)
from message m
left join campaign_contact n
on m.campaign_contact_id = n.id
left join question_response q
on n.id = q.campaign_contact_id
left join interaction_step i
on i.ID = q.interaction_step_id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
where [m.created_at = daterange]
and [o.name=organization]
and [c.title=campaign]
and i.question is not null
group by 1,2
--group by VANID, Phone, Question, Response
```
