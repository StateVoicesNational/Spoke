# How to Integrate with Zapier (or other HTTP endpoints)

## Step One - making sure your variables are set in your production/development deployment environment

While the original impetus for this integration was pushing payloads to Zapier,
it is not limited to sending payloads there. The payloads can be sent to any
HTTP endpoint.

- `BASE_URL` must be defined for your Spoke instance.
- At least one of the following must be defined (both may be defined):
  + `ZAPIER_WEBHOOK_URL` URL where payloads containing information on tag updates are sent.
  + `ZAPIER_ACTION_URL` URL where payloads containing information on questionResponse updates are sent.
- `ZAPIER_TIMEOUT_MS` is optional, and defines the timeout in milliseconds for POSTs to configured endpoints.
- `ZAPIER_CONFIG_OBJECT` is optional, and permits specific responses/answers to be POSTed to different URLs.

## Step Two - Configuration inside the Spoke admin portal

For receiving tag updates, no additional configuration is required inside
Spoke's admin panel. Simply setting the `ZAPIER_WEBHOOK_URL` is sufficient.
Whenever tag(s) are applied to a conversation, a payload is sent to the URL in
`ZAPIER_WEBHOOK_URL` with information on the event.

For receiving updates on questionResponses, it is necessary to both set
`ZAPIER_ACTION_URL` (and optionally `ZAPIER_CONFIG_OBJECT`, see step four) and
to set the Action Handler for desired responses/answers to `ZAPIER`. An example
screenshot is included below. Note how the `Action Handler` dropdown has
`ZAPIER` selected.

![Screenshot of Campaign Setup section of Spoke admin portal](https://i.imgur.com/dbo3Z3R.png)

Should the `Yes - I will attend` answer be recorded, then a payload with
information on the event will be sent to the URL specified in
`ZAPIER_ACTION_URL` (or a matching `webhook_url` in `ZAPIER_CONFIG_OBJECT` if
applicable; see step four).

## Step Three - Zapier basics

Zapier is a swiss army knife of middleware that accepts a litany of inputs
("Triggers" in Zapier parlance), can perform a dizzying array of transforms,
and push the results to a conucorpia of outputs. As an example, the Austin DSA
used this integration, in concert with Zapier, to record every positive ID for
GOTV efforts and:

1. Alert the team in Slack
2. Update internal Google Sheets with the data
3. Push data into an internal PostgreSQL data warehouse

A full example is outside the scope of this documentation, but most
importantly, this integration pushes data into Zapier by means of a Webhook
"Trigger". Webhooks are a premium offering by Zapier, so they aren't available
in Zapier's free tier. Zapier "Triggers" are the beginning event of "Zaps",
which are themselves collections of "Actions" taken upon data from "Triggers".

A couple screenshots of a webhook as a trigger in a Zap are included below.

![The "choose app & event" panel](https://i.imgur.com/R3Vb0Tt.png)

![The "Set up trigger" panel](https://i.imgur.com/pHOaVx4.png)

Once the Webhook Trigger is configured, you will have a webhook URL that looks
something like this:

`https://hooks.zapier.com/hooks/catch/9728183/buwza5x/`

This is what you will set for `ZAPIER_WEBHOOK_URL` or `ZAPIER_ACTION_URL`
(should you desire both, then we recommend making separate "Zaps" for tags and
questionResponses, and possibly separate zaps per answer/response (see section
four on the `ZAPIER_CONFIG_OBJECT` environment variable)).

At this point, you can set up a test campaign in Spoke, and apply some tags
to conversations and/or record some questionResponses in some conversations.
Once you have done so, Zapier will list some of the requests it received from
Spoke in the "Test trigger" panel:

![The "Test trigger" panel](https://i.imgur.com/wnmVEdu.png)

Once Zapier has some examples, you can then proceed to use those data points in
subsequent "Actions". An example of sending a message to a slack channel that
has information from the request/payload is below.

![An example "Send Channel Message in Slack" Action](https://i.imgur.com/OhQVVfL.png)

## Step Four - Understanding `ZAPIER_CONFIG_OBJECT`

An example value for `ZAPIER_CONFIG_OBJECT` is below.

```
{
  "processAction":[
    {
      "answer_name": "Yes - I will attend",
      "webhook_url": "https://hooks.zapier.com/hooks/catch/9728183/buwza5x/"
    },
    {
      "answer_name": "Maybe - I might attend",
      "webhook_url": "https://hooks.zapier.com/hooks/catch/9728183/buwzgj6/"
    },
    {
      "answer_name": "No - I will not attend",
      "webhook_url": "https://hooks.zapier.com/hooks/catch/9728183/buwzqbr/"
    }
  ]
}
```

The configuration object consists, as of 2021-08-14, of a single top-level
property named "processAction", which is an array of objects. These objects
have two string properties: "answer_name" and "webhook_url".

The "answer_name" string corresponds to the string provided as the answer name
in a "response" to a given question. If you review the screenshot in section 2,
you'll notice that the `Answer` is `Yes - I will attend` (and, of course, the
`Action Handler` is set to `ZAPIER`). Since the example `ZAPIER_CONFIG_OBJECT`
has an `answer_name` entry with that exact string, the payload for that
particular questionResponse update will be sent to
`https://hooks.zapier.com/hooks/catch/9728183/buwza5x/`, rather than whatever
URL is provided in `ZAPIER_ACTION_URL`.

The "webhook_url" is where questionResponse updates whose answer name matches
"answer_name" are sent. For Zapier specifically, their branching support is
limited. Hence, the ability to create numerous Zapier Webhook URLs and handle
them each individually.

## Step Five - Example payloads

An example payload for tag updates is below.

```
{
  "texter": {
    "name": "Claudia Maness",
    "email": "aspensmonster@riseup.net"
  },
  "campaign": {
    "id": 62,
    "title": "COPY - COPY - Test Campaign for PR 1995"
  },
  "conversation": "https://spoke.noonpropb2021.org/app/1/todos/review/59848",
  "tags": [
    "four",
    "five"
  ]
}
```

An example payload for questionResponse updates is below.

```
{
  "questionResponse": {
    "campaignContactId": "59845",
    "interactionStepId": "527",
    "value": "four"
  },
  "interactionStep": {
    "id": 531,
    "campaign_id": 60,
    "question": "",
    "script": "Thanks.",
    "created_at": "2021-08-14T00:41:04.107Z",
    "parent_interaction_id": 527,
    "answer_option": "four",
    "answer_actions": "zapier-action",
    "is_deleted": false,
    "answer_actions_data": "",
    "answerOptions": []
  },
  "campaignContactId": 59845,
  "contact": {
    "id": 59845,
    "campaign_id": 60,
    "assignment_id": 93,
    "external_id": "2",
    "first_name": "Heather",
    "last_name": "Couper",
    "cell": "+12135550129",
    "zip": "",
    "custom_fields": "{\"day\":\"Wednesday\"}",
    "created_at": "2021-08-14T00:37:40.681Z",
    "updated_at": "2021-08-14T01:54:49.308Z",
    "message_status": "convo",
    "is_opted_out": false,
    "timezone_offset": "",
    "error_code": null
  },
  "campaign": {
    "id": 60,
    "organization_id": 1,
    "title": "Test Campaign for PR 1995",
    "description": "https://github.com/MoveOnOrg/Spoke/pull/1995",
    "is_started": true,
    "due_by": "2021-08-17T00:00:00.000Z",
    "created_at": "2021-08-14T00:34:57.590Z",
    "is_archived": false,
    "use_dynamic_assignment": null,
    "logo_image_url": null,
    "intro_html": null,
    "primary_color": null,
    "override_organization_texting_hours": false,
    "texting_hours_enforced": true,
    "texting_hours_start": 9,
    "texting_hours_end": 21,
    "timezone": "US/Eastern",
    "creator_id": 1,
    "messageservice_sid": "MGe5bd781e9c314eef0670eb54b2c248c2",
    "use_own_messaging_service": false,
    "join_token": "0999ab59-87d7-4be8-8cc7-c626a1e07463",
    "batch_size": 300,
    "response_window": 48,
    "usedFields": {
      "firstName": 1
    },
    "customFields": [
      "day"
    ],
    "interactionSteps": [
      {
        "id": 527,
        "campaign_id": 60,
        "question": "What number between one and five.",
        "script": "Hey {firstName}. It's Claudia testing some stuff. Do me a favor and give me a number between one and five.",
        "created_at": "2021-08-14T00:34:57.614Z",
        "parent_interaction_id": null,
        "answer_option": "",
        "answer_actions": "",
        "is_deleted": false,
        "answer_actions_data": null,
        "answerOptions": [
          {
            "nextInteractionStep": {
              "id": 528,
              "campaign_id": 60,
              "question": "",
              "script": "Thanks.",
              "created_at": "2021-08-14T00:41:04.093Z",
              "parent_interaction_id": 527,
              "answer_option": "one",
              "answer_actions": "zapier-action",
              "is_deleted": false,
              "answer_actions_data": ""
            },
            "value": "one",
            "action": "zapier-action",
            "action_data": "",
            "interaction_step_id": 528,
            "parent_interaction_step": 527
          },
          {
            "nextInteractionStep": {
              "id": 529,
              "campaign_id": 60,
              "question": "",
              "script": "Thanks.",
              "created_at": "2021-08-14T00:41:04.097Z",
              "parent_interaction_id": 527,
              "answer_option": "two",
              "answer_actions": "zapier-action",
              "is_deleted": false,
              "answer_actions_data": ""
            },
            "value": "two",
            "action": "zapier-action",
            "action_data": "",
            "interaction_step_id": 529,
            "parent_interaction_step": 527
          },
          {
            "nextInteractionStep": {
              "id": 530,
              "campaign_id": 60,
              "question": "",
              "script": "Thanks.",
              "created_at": "2021-08-14T00:41:04.103Z",
              "parent_interaction_id": 527,
              "answer_option": "three",
              "answer_actions": "zapier-action",
              "is_deleted": false,
              "answer_actions_data": ""
            },
            "value": "three",
            "action": "zapier-action",
            "action_data": "",
            "interaction_step_id": 530,
            "parent_interaction_step": 527
          },
          {
            "nextInteractionStep": {
              "id": 531,
              "campaign_id": 60,
              "question": "",
              "script": "Thanks.",
              "created_at": "2021-08-14T00:41:04.107Z",
              "parent_interaction_id": 527,
              "answer_option": "four",
              "answer_actions": "zapier-action",
              "is_deleted": false,
              "answer_actions_data": ""
            },
            "value": "four",
            "action": "zapier-action",
            "action_data": "",
            "interaction_step_id": 531,
            "parent_interaction_step": 527
          },
          {
            "nextInteractionStep": {
              "id": 532,
              "campaign_id": 60,
              "question": "",
              "script": "Thanks.",
              "created_at": "2021-08-14T00:41:04.110Z",
              "parent_interaction_id": 527,
              "answer_option": "five",
              "answer_actions": "zapier-action",
              "is_deleted": false,
              "answer_actions_data": ""
            },
            "value": "five",
            "action": "zapier-action",
            "action_data": "",
            "interaction_step_id": 532,
            "parent_interaction_step": 527
          }
        ]
      },
      {
        "id": 528,
        "campaign_id": 60,
        "question": "",
        "script": "Thanks.",
        "created_at": "2021-08-14T00:41:04.093Z",
        "parent_interaction_id": 527,
        "answer_option": "one",
        "answer_actions": "zapier-action",
        "is_deleted": false,
        "answer_actions_data": "",
        "answerOptions": []
      },
      {
        "id": 529,
        "campaign_id": 60,
        "question": "",
        "script": "Thanks.",
        "created_at": "2021-08-14T00:41:04.097Z",
        "parent_interaction_id": 527,
        "answer_option": "two",
        "answer_actions": "zapier-action",
        "is_deleted": false,
        "answer_actions_data": "",
        "answerOptions": []
      },
      {
        "id": 530,
        "campaign_id": 60,
        "question": "",
        "script": "Thanks.",
        "created_at": "2021-08-14T00:41:04.103Z",
        "parent_interaction_id": 527,
        "answer_option": "three",
        "answer_actions": "zapier-action",
        "is_deleted": false,
        "answer_actions_data": "",
        "answerOptions": []
      },
      {
        "id": 531,
        "campaign_id": 60,
        "question": "",
        "script": "Thanks.",
        "created_at": "2021-08-14T00:41:04.107Z",
        "parent_interaction_id": 527,
        "answer_option": "four",
        "answer_actions": "zapier-action",
        "is_deleted": false,
        "answer_actions_data": "",
        "answerOptions": []
      },
      {
        "id": 532,
        "campaign_id": 60,
        "question": "",
        "script": "Thanks.",
        "created_at": "2021-08-14T00:41:04.110Z",
        "parent_interaction_id": 527,
        "answer_option": "five",
        "answer_actions": "zapier-action",
        "is_deleted": false,
        "answer_actions_data": "",
        "answerOptions": []
      }
    ],
    "contactTimezones": [
      ""
    ],
    "contactsCount": 3,
    "assignedCount": "3",
    "messagedCount": "3",
    "needsResponseCount": "3",
    "errorCount": null
  },
  "organization": {
    "id": 1,
    "uuid": "e509bc58-403a-4b85-9609-139cbaa46901",
    "name": "Homes Not Handcuffs",
    "created_at": "2021-03-25T04:43:24.159Z",
    "features": "{\"TWILIO_ACCOUNT_SID\":\"ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\",\"TWILIO_AUTH_TOKEN_ENCRYPTED\":\"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\",\"TWILIO_MESSAGE_SERVICE_SID\":\"MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\"}",
    "texting_hours_enforced": false,
    "texting_hours_start": 9,
    "texting_hours_end": 21,
    "feature": {
      "TWILIO_ACCOUNT_SID": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "TWILIO_AUTH_TOKEN_ENCRYPTED": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "TWILIO_MESSAGE_SERVICE_SID": "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  },
  "previousValue": null,
  "conversationLink": "https://spoke.marxwasright.org/app/1/todos/review/59845"
}
```
