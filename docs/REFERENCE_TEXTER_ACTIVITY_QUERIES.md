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

- Messages by Organization, Date, Campaign, or Users

``` sql
SELECT count(*)
FROM message m
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=

```

- Phone Numbers Texted

``` sql
select count(distinct m.contact_number) from message m
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
```

- Outbound Messages

```sql

select count(*) from message m 
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
```

- Inbound Messages

```sql
select count(*) from message m 
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
```
- Texters

```sql
SELECT count(distinct m.user_id) from message m
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
```

- Inbound vs Outbound, Pie Graph

```sql
select case when m.is_from_contact = true then 'Inbound' else 'Outbound' end as MessageType, count(*) from message m 
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL

group by MessageType
```
- Message Status

```sql
select n.message_status, count(*)
from campaign_contact n
left join campaign c
on c.id = n.campaign_id
left join organization o 
on o.ID = c.organization_ID
w-- PLUG IN YOUR DATES
where m.created_at = 
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
group by n.message_status
```

- Send Success Rate

```sql
select m.send_status, count(*) from message m
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
group by m.send_status
```

- Total Messages by Date

```sql
select c.title as Campaign, to_char(m.sent_at :: DATE, 'yyyy-mm-dd') as Sent, count(m.ID) as Messages from message m
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
group by campaign, sent
```

- Activity by Organization

```sql
SELECT o.name as "Organization", count(*) as "Messages", count(distinct m.contact_number) as "Contacts Texted"
FROM message m

left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL

group by "Organization"
order by "Messages" desc
```

- Campaign Questions


```sql
select distinct i.question as Questions from interaction_step i
left join campaign c
on c.ID = i.campaign_id
left join campaign_contact t
on t.campaign_id = c.ID
left join message m
on m.campaign_contact_id = t.ID
left join public."user" u
on u.id = m.user_id
left join organization o 
on c.organization_ID = o.ID
where i.question <> ''
and i.question LIKE '%?'
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
and m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
```

- Campaigns

```sql
select o.name as Organization, c.title as Campaign, to_char(c.created_at :: DATE, 'mm/dd/yyyy') as Created, to_char(c.due_by :: DATE, 'mm/dd/yyyy') as Due from campaign c
left join campaign_contact t
on t.campaign_id = c.ID
left join message m
on m.campaign_contact_id = t.ID
left join public."user" u
on u.id = m.user_id
join organization o 
on c.organization_ID = o.ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where c.created_at >= 
and c.due_by <= 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL


group by o.name, c.title, c.created_at, c.due_by
order by c.due_by desc, c.created_at desc
```

- Questions & Responses

```sql
select 
--n.external_ID as VANID,
--m.contact_number as Phone,
i.question as Question, 
q.value as Response, 
count(*)
from message m
left join public."user" u
on u.id = m.user_id
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

where i.question is not null
and i.question != ''
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
and m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
group by 1,2
--group by VANID, Phone, Question, Response
```

- User Roles

```sql
select u.first_name as "First Name", u.last_name as "Last Name", r.role as "Role", o.name as "Organization" from user_organization r
join public."user" u 
on u.id = r.user_id
join organization o
on o.id = r.organization_id
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
and o.name= 
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
order by "Organization" asc, "Role" asc
```

- Admins

```sql
select u.first_name as "First Name", u.last_name as "Last Name", r.role as "Role", o.name as "Organization" from user_organization r
join public."user" u 
on u.id = r.user_id
join organization o
on o.id = r.organization_id
where r.role in ('ADMIN', 'OWNER')
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
and o.name= 
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
order by "Organization" asc, "Role" asc
```

- Purchased Phone Numbers

```sql
select o.name as "Organization", left(p.phone_number, 5) as "Area Code Purchased", count(*) as "Numbers Purchased", count(*)*200 as "Daily Outgoing Messages Allowed", count(*)*0.75 as "Cost"
from owned_phone_number p
left join organization o
on o.id = p.organization_id
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where o.name= 
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
group by "Organization", "Area Code Purchased"
order by "Organization" asc, "Area Code Purchased" asc
```

- Phone Numbers by Campaign

```sql
select o.name as "Organization", c.title as "Campaign Name", 
--p.allocated_to_id as "Campaign ID", 
count(*) as "Numbers Purchased", count(*)*200 as "Daily Outgoing Messages Allowed"
from owned_phone_number p
left join organization o
on o.id = p.organization_id
left join campaign c
on o.id = c.organization_id
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where o.name= 
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
and p.allocated_to != 'messaging_service'
--and [p.allocated_at = daterange]
group by "Organization", "Campaign Name"
order by "Organization" asc
```

- Texter Activity by Campaign

```sql
select 
CONCAT(u.first_name, ' ', u.last_name) as "Texter"
, u.email as "Texter Email"
,o.name as "Org"
, c.title as "Campaign"
,  count(*) as "Outgoing Messages"
, count(distinct m.contact_number) as "Contacts Texted"

from message m


left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

where  m.is_from_contact = false
and u.email is not null 
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
and m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL


group by "Org", "Campaign", "Texter", "Texter Email"
order by "Org", "Campaign", "Contacts Texted" desc, "Outgoing Messages" desc
```

- Error Codes

```sql
select case 
    when m.error_code in (30003,3005,30006) then 'Likely Landline'
    when m.error_code = 21611 then 'Not Enough Phone #s Purchased'
    when m.error_code = 30007 then 'Carrier Violation'
    when m.error_code = '-1' then 'Connection Issue'
    else 'Other Error'
    end as "Error Code"
, count(*) from message m
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL

group by m.error_code
```

- Error Code Details

```sql
select 
 o.name as "Organization"
,c.title as "Campaign"
, case 
    when m.error_code in (30003,30005,30006) then 'Likely Landline'
    when m.error_code = 21611 then 'Not Enough Phone #s Purchased'
    when m.error_code = 30007 then 'Carrier Violation'
    when m.error_code = '-1' then 'Connection Issue'
    else 'Other Error'
    end as "Error Code"
--, m.error_code as "Error Code"
, count(*) 
from message m

left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID

-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
and c.title NOT LIKE 'New Campaign'

group by "Organization", "Campaign", "Error Code" 
order by "Organization" asc, "Campaign", "Error Code" asc
```

- Carrier Violations

```sql
select 
 o.name as "Organization"
,c.title as "Campaign"
, count(*) as "Error Codes"
from message m

left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
and c.title NOT LIKE 'New Campaign'
and m.error_code = 30007

group by "Organization", "Campaign"
order by "Error Codes" desc
```

- Flagged Initial Messages


```sql
select 
distinct right(m.text, 120) as "Message",
o.name as "Org",
c.title as "Campaign"
--,m.sent_at 

from message m 

left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
and m.is_from_contact = false
and c.title NOT LIKE '%Test%'
and c.title NOT LIKE '%Demo%'
and c.title NOT LIKE 'New Campaign'
and m.error_code = '30007'
order by "Org", "Campaign", "Message"
```

- Cost by Org

```sql
Select "Org", SUM("Cost") as "Cost" from

(

SELECT o.name as "Org", count(*)*0.00562 as "Cost"
FROM message m
left join public."user" u
on u.id = m.user_id
left join campaign_contact n
on m.campaign_contact_id = n.id
left join campaign c
on n.campaign_id = c.ID
left join organization o
on o.ID = c.organization_ID
-- PLUG IN YOUR DATES, ORGANIZATION NAME, CAMPAIGNS, AND /OR USERS BELOW
where m.created_at = 
and o.name= 
and c.title=
and CONCAT(u.first_name, ' ', u.last_name)=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL
  group by "Org"

UNION ALL

select o.name as "Org", count(*)*0.75 as "Cost"
from owned_phone_number p
left join organization o
on o.id = p.organization_id
-- PLUG IN YOUR ORGANIZATION NAME BELOW
where o.name=
-- PLUG IN DETAILS ABOVE, OR DO NOT INCLUDE AT ALL

  group by "Org"
) s

group by "Org"
order by "Cost" desc
```
