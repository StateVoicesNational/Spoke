import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";
import nock from "nock";

const ZapierAction = require("../../../src/extensions/action-handlers/zapier-action");
require("../../test_helpers");
const log = require("../../../src/lib").log;

afterEach(async () => {
  jest.restoreAllMocks();
});

describe("zapier-action", () => {
  let veryFakeOrganization;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    process.env = { ...OLD_ENV };
    jest.spyOn(log, "info");
    veryFakeOrganization = {
      id: 9001
    };
  });

  afterEach(async () => {
    process.env = OLD_ENV;
  });

  it("should pass validation", async () => {
    expect(() => validateActionHandler(ZapierAction)).not.toThrowError();
  });

  it("should not report available if minimum environment vars are NOT set", async () => {
    // notice that no relevant environment variables are defined here.
    const ret = await ZapierAction.available(veryFakeOrganization);
    expect(ret.result).toBe(false);
  });

  it("should report available if minimum environment vars ARE set", async () => {
    process.env.BASE_URL = "https://spoke.marxwasright.com";

    process.env.ZAPIER_WEBHOOK_URL =
      "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";
    const ret = await ZapierAction.available(veryFakeOrganization);
    expect(ret.result).toBe(true);

    delete process.env.ZAPIER_WEBHOOK_URL;

    process.env.ZAPIER_ACTION_URL =
      "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";
    const ret2 = await ZapierAction.available(veryFakeOrganization);
    expect(ret2.result).toBe(true);
  });

  describe("#onTagUpdate", async () => {
    it("should bail if ZAPIER_WEBHOOK_URL is undefined", async () => {
      process.env.ZAPIER_WEBHOOK_URL = undefined;
      const ret = await ZapierAction.onTagUpdate(null, null, null, null, null);
      expect(log.info.mock.calls[0][0]).toEqual(
        "ZAPIER_WEBHOOK_URL is undefined. Exiting."
      );
    });

    it("should craft the expected payload and submit it to the configured endpoint", async () => {
      process.env.BASE_URL = "https://spoke.marxwasright.org";
      process.env.ZAPIER_WEBHOOK_URL =
        "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";

      // sample input data

      let tags = [
        {
          id: "5",
          name: "four"
        },
        {
          id: "6",
          name: "five"
        }
      ];

      let contact = {
        id: 59848,
        campaign_id: 62,
        assignment_id: 95,
        external_id: "1",
        first_name: "Preston",
        last_name: "Maness",
        cell: "+15129551048",
        zip: "",
        custom_fields: '{"day":"Tuesday"}',
        created_at: "2021-08-14T02:01:39.528Z",
        updated_at: "2021-08-14T02:03:14.283Z",
        message_status: "convo",
        is_opted_out: false,
        timezone_offset: "",
        error_code: null
      };

      let campaign = {
        id: 62,
        organization_id: 1,
        title: "COPY - COPY - Test Campaign for PR 1995",
        description: "https://github.com/MoveOnOrg/Spoke/pull/1995",
        is_started: true,
        due_by: "2021-08-17T00:00:00.000Z",
        created_at: "2021-08-14T02:00:08.065Z",
        is_archived: false,
        use_dynamic_assignment: null,
        logo_image_url: null,
        intro_html: null,
        primary_color: null,
        override_organization_texting_hours: false,
        texting_hours_enforced: true,
        texting_hours_start: 9,
        texting_hours_end: 21,
        timezone: "US/Eastern",
        creator_id: 1,
        messageservice_sid: "MGe5bd781e9c314eef0670eb54b2c248c2",
        use_own_messaging_service: false,
        join_token: "a5fe9747-3691-4f13-bf00-a6ceb21c73c0",
        batch_size: 300,
        features: {
          TEXTER_UI_SETTINGS:
            '{"default-dynamicassignment":true,"default-releasecontacts":true,"default-editinitial":true,"tag-contact":true}'
        },
        response_window: 48,
        usedFields: {
          firstName: 1
        },
        customFields: ["day"],
        feature: {
          TEXTER_UI_SETTINGS:
            '{"default-dynamicassignment":true,"default-releasecontacts":true,"default-editinitial":true,"tag-contact":true}'
        },
        interactionSteps: [
          {
            id: 539,
            campaign_id: 62,
            question: "What number between one and five.",
            script:
              "Hey {firstName}. It's Preston testing some stuff. Do me a favor and give me a number between one and five.",
            created_at: "2021-08-14T02:00:08.087Z",
            parent_interaction_id: null,
            answer_option: "",
            answer_actions: "",
            is_deleted: false,
            answer_actions_data: null,
            answerOptions: [
              {
                nextInteractionStep: {
                  id: 540,
                  campaign_id: 62,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T02:00:08.101Z",
                  parent_interaction_id: 539,
                  answer_option: "one",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "one",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 540,
                parent_interaction_step: 539
              },
              {
                nextInteractionStep: {
                  id: 541,
                  campaign_id: 62,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T02:00:08.106Z",
                  parent_interaction_id: 539,
                  answer_option: "two",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "two",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 541,
                parent_interaction_step: 539
              },
              {
                nextInteractionStep: {
                  id: 542,
                  campaign_id: 62,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T02:00:08.114Z",
                  parent_interaction_id: 539,
                  answer_option: "three",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "three",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 542,
                parent_interaction_step: 539
              },
              {
                nextInteractionStep: {
                  id: 543,
                  campaign_id: 62,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T02:00:08.120Z",
                  parent_interaction_id: 539,
                  answer_option: "four",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "four",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 543,
                parent_interaction_step: 539
              },
              {
                nextInteractionStep: {
                  id: 544,
                  campaign_id: 62,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T02:00:08.126Z",
                  parent_interaction_id: 539,
                  answer_option: "five",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "five",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 544,
                parent_interaction_step: 539
              }
            ]
          },
          {
            id: 540,
            campaign_id: 62,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T02:00:08.101Z",
            parent_interaction_id: 539,
            answer_option: "one",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 541,
            campaign_id: 62,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T02:00:08.106Z",
            parent_interaction_id: 539,
            answer_option: "two",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 542,
            campaign_id: 62,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T02:00:08.114Z",
            parent_interaction_id: 539,
            answer_option: "three",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 543,
            campaign_id: 62,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T02:00:08.120Z",
            parent_interaction_id: 539,
            answer_option: "four",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 544,
            campaign_id: 62,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T02:00:08.126Z",
            parent_interaction_id: 539,
            answer_option: "five",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          }
        ],
        contactTimezones: [""],
        contactsCount: 1,
        assignedCount: "1",
        messagedCount: "1",
        needsResponseCount: "0",
        errorCount: null
      };

      let organization = {
        id: 1,
        uuid: "e509bc58-403a-4b85-9609-139cbaa46901",
        name: "Homes Not Handcuffs",
        created_at: "2021-03-25T04:43:24.159Z",
        features:
          '{"TWILIO_ACCOUNT_SID":"AC227a2371464cd358c4f24f8d83d31818","TWILIO_AUTH_TOKEN_ENCRYPTED":"1a94ba437369a08b15ee422d907a1da5:6bc6511993e057285a44c71a60a545bfe29edb772d181e3022984b941801c04c5294c6a8d8eb302b778b5b578c043883","TWILIO_MESSAGE_SERVICE_SID":"MGe5bd781e9c314eef0670eb54b2c248c2"}',
        texting_hours_enforced: false,
        texting_hours_start: 9,
        texting_hours_end: 21,
        feature: {
          TWILIO_ACCOUNT_SID: "AC227a2371464cd358c4f24f8d83d31818",
          TWILIO_AUTH_TOKEN_ENCRYPTED:
            "1a94ba437369a08b15ee422d907a1da5:6bc6511993e057285a44c71a60a545bfe29edb772d181e3022984b941801c04c5294c6a8d8eb302b778b5b578c043883",
          TWILIO_MESSAGE_SERVICE_SID: "MGe5bd781e9c314eef0670eb54b2c248c2"
        }
      };

      let texter = {
        first_name: "Preston",
        last_name: "Maness",
        email: "aspensmonster@riseup.net"
      };

      // expected payload to be sent to endpoint based off of input data

      let expected_payload = {
        texter: {
          name: "Preston Maness",
          email: "aspensmonster@riseup.net"
        },
        campaign: {
          id: 62,
          title: "COPY - COPY - Test Campaign for PR 1995"
        },
        conversation: "https://spoke.marxwasright.org/app/1/todos/review/59848",
        tags: ["four", "five"]
      };

      const api_call = nock("https://hooks.zapier.com")
        .post("/hooks/catch/9728183/buwz0q0/", JSON.stringify(expected_payload))
        .reply(200);

      await ZapierAction.onTagUpdate(
        tags,
        contact,
        campaign,
        organization,
        texter
      );

      expect(api_call.isDone());
    });
  });

  describe("#processAction", async () => {
    let questionResponse;
    let interactionStep;
    let campaignContactId;
    let contact;
    let campaign;
    let organization;
    let previousValue;

    // sample data.
    beforeEach(() => {
      questionResponse = {
        campaignContactId: "59845",
        interactionStepId: "527",
        value: "four"
      };

      interactionStep = {
        id: 531,
        campaign_id: 60,
        question: "",
        script: "Thanks.",
        created_at: "2021-08-14T00:41:04.107Z",
        parent_interaction_id: 527,
        answer_option: "four",
        answer_actions: "zapier-action",
        is_deleted: false,
        answer_actions_data: "",
        answerOptions: []
      };

      campaignContactId = 59845;

      contact = {
        id: 59845,
        campaign_id: 60,
        assignment_id: 93,
        external_id: "2",
        first_name: "Patrick",
        last_name: "Maness",
        cell: "+15129031315",
        zip: "",
        custom_fields: '{"day":"Wednesday"}',
        created_at: "2021-08-14T00:37:40.681Z",
        updated_at: "2021-08-14T01:54:49.308Z",
        message_status: "convo",
        is_opted_out: false,
        timezone_offset: "",
        error_code: null
      };

      campaign = {
        id: 60,
        organization_id: 1,
        title: "Test Campaign for PR 1995",
        description: "https://github.com/MoveOnOrg/Spoke/pull/1995",
        is_started: true,
        due_by: "2021-08-17T00:00:00.000Z",
        created_at: "2021-08-14T00:34:57.590Z",
        is_archived: false,
        use_dynamic_assignment: null,
        logo_image_url: null,
        intro_html: null,
        primary_color: null,
        override_organization_texting_hours: false,
        texting_hours_enforced: true,
        texting_hours_start: 9,
        texting_hours_end: 21,
        timezone: "US/Eastern",
        creator_id: 1,
        messageservice_sid: "MGe5bd781e9c314eef0670eb54b2c248c2",
        use_own_messaging_service: false,
        join_token: "0999ab59-87d7-4be8-8cc7-c626a1e07463",
        batch_size: 300,
        features: null,
        response_window: 48,
        usedFields: {
          firstName: 1
        },
        customFields: ["day"],
        feature: {},
        interactionSteps: [
          {
            id: 527,
            campaign_id: 60,
            question: "What number between one and five.",
            script:
              "Hey {firstName}. It's Preston testing some stuff. Do me a favor and give me a number between one and five.",
            created_at: "2021-08-14T00:34:57.614Z",
            parent_interaction_id: null,
            answer_option: "",
            answer_actions: "",
            is_deleted: false,
            answer_actions_data: null,
            answerOptions: [
              {
                nextInteractionStep: {
                  id: 528,
                  campaign_id: 60,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T00:41:04.093Z",
                  parent_interaction_id: 527,
                  answer_option: "one",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "one",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 528,
                parent_interaction_step: 527
              },
              {
                nextInteractionStep: {
                  id: 529,
                  campaign_id: 60,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T00:41:04.097Z",
                  parent_interaction_id: 527,
                  answer_option: "two",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "two",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 529,
                parent_interaction_step: 527
              },
              {
                nextInteractionStep: {
                  id: 530,
                  campaign_id: 60,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T00:41:04.103Z",
                  parent_interaction_id: 527,
                  answer_option: "three",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "three",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 530,
                parent_interaction_step: 527
              },
              {
                nextInteractionStep: {
                  id: 531,
                  campaign_id: 60,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T00:41:04.107Z",
                  parent_interaction_id: 527,
                  answer_option: "four",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "four",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 531,
                parent_interaction_step: 527
              },
              {
                nextInteractionStep: {
                  id: 532,
                  campaign_id: 60,
                  question: "",
                  script: "Thanks.",
                  created_at: "2021-08-14T00:41:04.110Z",
                  parent_interaction_id: 527,
                  answer_option: "five",
                  answer_actions: "zapier-action",
                  is_deleted: false,
                  answer_actions_data: ""
                },
                value: "five",
                action: "zapier-action",
                action_data: "",
                interaction_step_id: 532,
                parent_interaction_step: 527
              }
            ]
          },
          {
            id: 528,
            campaign_id: 60,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T00:41:04.093Z",
            parent_interaction_id: 527,
            answer_option: "one",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 529,
            campaign_id: 60,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T00:41:04.097Z",
            parent_interaction_id: 527,
            answer_option: "two",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 530,
            campaign_id: 60,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T00:41:04.103Z",
            parent_interaction_id: 527,
            answer_option: "three",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 531,
            campaign_id: 60,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T00:41:04.107Z",
            parent_interaction_id: 527,
            answer_option: "four",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          },
          {
            id: 532,
            campaign_id: 60,
            question: "",
            script: "Thanks.",
            created_at: "2021-08-14T00:41:04.110Z",
            parent_interaction_id: 527,
            answer_option: "five",
            answer_actions: "zapier-action",
            is_deleted: false,
            answer_actions_data: "",
            answerOptions: []
          }
        ],
        contactTimezones: [""],
        contactsCount: 3,
        assignedCount: "3",
        messagedCount: "3",
        needsResponseCount: "3",
        errorCount: null
      };

      organization = {
        id: 1,
        uuid: "e509bc58-403a-4b85-9609-139cbaa46901",
        name: "Homes Not Handcuffs",
        created_at: "2021-03-25T04:43:24.159Z",
        features:
          '{"TWILIO_ACCOUNT_SID":"AC227a2371464cd358c4f24f8d83d31818","TWILIO_AUTH_TOKEN_ENCRYPTED":"1a94ba437369a08b15ee422d907a1da5:6bc6511993e057285a44c71a60a545bfe29edb772d181e3022984b941801c04c5294c6a8d8eb302b778b5b578c043883","TWILIO_MESSAGE_SERVICE_SID":"MGe5bd781e9c314eef0670eb54b2c248c2"}',
        texting_hours_enforced: false,
        texting_hours_start: 9,
        texting_hours_end: 21,
        feature: {
          TWILIO_ACCOUNT_SID: "AC227a2371464cd358c4f24f8d83d31818",
          TWILIO_AUTH_TOKEN_ENCRYPTED:
            "1a94ba437369a08b15ee422d907a1da5:6bc6511993e057285a44c71a60a545bfe29edb772d181e3022984b941801c04c5294c6a8d8eb302b778b5b578c043883",
          TWILIO_MESSAGE_SERVICE_SID: "MGe5bd781e9c314eef0670eb54b2c248c2"
        }
      };

      previousValue = null;
    });

    it("should bail if ZAPIER_ACTION_URL is undefined", async () => {
      process.env.ZAPIER_ACTION_URL = undefined;
      const ret = await ZapierAction.processAction({
        questionResponse,
        interactionStep,
        campaignContactId,
        contact,
        campaign,
        organization,
        previousValue
      });
      expect(log.info.mock.calls[0][0]).toEqual(
        "ZAPIER_ACTION_URL is undefined. Exiting."
      );
    });

    it("should use ZAPIER_ACTION_URL if ZAPIER_CONFIG_OBJECT is undefined", async () => {
      process.env.BASE_URL = "https://spoke.marxwasright.org";
      process.env.ZAPIER_ACTION_URL =
        "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";

      const api_call = nock("https://hooks.zapier.com")
        .post("/hooks/catch/9728183/buwz0q0/")
        .reply(200);

      await ZapierAction.processAction({
        questionResponse,
        interactionStep,
        campaignContactId,
        contact,
        campaign,
        organization,
        previousValue
      });

      expect(api_call.isDone());
    });

    it("should use ZAPIER_ACTION_URL if ZAPIER_CONFIG_OBJECT is not well-formed", async () => {
      process.env.BASE_URL = "https://spoke.marxwasright.org";
      process.env.ZAPIER_ACTION_URL =
        "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";

      let config = {
        processAction: [
          {
            hackthe: "one",
            planet: "https://hooks.zapier.com/hooks/catch/9728183/buwza5x/"
          },
          {
            hackthe: "two",
            planet: "https://hooks.zapier.com/hooks/catch/9728183/buwzgj6/"
          }
        ]
      };

      process.env.ZAPIER_CONFIG_OBJECT = JSON.stringify(config);

      // since config is not well-formed, the code falls back to
      // ZAPIER_ACTION_URL rather than any URLs in config.
      const api_call = nock("https://hooks.zapier.com")
        .post("/hooks/catch/9728183/buwz0q0/")
        .reply(200);

      await ZapierAction.processAction({
        questionResponse,
        interactionStep,
        campaignContactId,
        contact,
        campaign,
        organization,
        previousValue
      });

      expect(api_call.isDone());
    });

    it("should use ZAPIER_ACTION_URL if ZAPIER_CONFIG_OBJECT does not contain a specific URL for a given answer_option", async () => {
      process.env.BASE_URL = "https://spoke.marxwasright.org";
      process.env.ZAPIER_ACTION_URL =
        "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";

      let config = {
        processAction: [
          {
            answer_name: "one",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwza5x/"
          },
          {
            answer_name: "two",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwzgj6/"
          }
        ]
      };

      process.env.ZAPIER_CONFIG_OBJECT = JSON.stringify(config);

      // config is well-formed, but there is no entry for
      // answer_name/answer_option, so we use ZAPIER_ACTION_URL
      const api_call = nock("https://hooks.zapier.com")
        .post("/hooks/catch/9728183/buwz0q0/")
        .reply(200);

      await ZapierAction.processAction({
        questionResponse,
        interactionStep,
        campaignContactId,
        contact,
        campaign,
        organization,
        previousValue
      });

      expect(api_call.isDone());
    });

    it("should use the answer_name-specific webhook URL if it is found in ZAPIER_CONFIG_OBJECT", async () => {
      process.env.BASE_URL = "https://spoke.marxwasright.org";
      process.env.ZAPIER_ACTION_URL =
        "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";

      let config = {
        processAction: [
          {
            answer_name: "one",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwza5x/"
          },
          {
            answer_name: "two",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwzgj6/"
          },
          {
            answer_name: "four",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwzqtu/"
          }
        ]
      };

      process.env.ZAPIER_CONFIG_OBJECT = JSON.stringify(config);

      // config is well-formed, and there is a match to the input data
      // (answer_option of "four" is in config, so we use its webhook_url
      // instead of ZAPIER_ACTION_URL)
      const api_call = nock("https://hooks.zapier.com")
        .post("/hooks/catch/9728183/buwzqtu/")
        .reply(200);

      await ZapierAction.processAction({
        questionResponse,
        interactionStep,
        campaignContactId,
        contact,
        campaign,
        organization,
        previousValue
      });

      expect(api_call.isDone());
    });

    it("should craft the expected payload given inputs, stripping feature/features from campaign", async () => {
      process.env.BASE_URL = "https://spoke.marxwasright.org";
      process.env.ZAPIER_ACTION_URL =
        "https://hooks.zapier.com/hooks/catch/9728183/buwz0q0/";

      let config = {
        processAction: [
          {
            answer_name: "one",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwza5x/"
          },
          {
            answer_name: "two",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwzgj6/"
          },
          {
            answer_name: "four",
            webhook_url: "https://hooks.zapier.com/hooks/catch/9728183/buwzqtu/"
          }
        ]
      };

      process.env.ZAPIER_CONFIG_OBJECT = JSON.stringify(config);

      // The payload format is mostly the same as the input, but with
      // some sensitive properties stripped, and a conversationLink added.
      let sanitized_campaign = { ...campaign };
      delete sanitized_campaign.feature;
      delete sanitized_campaign.features;

      let expected_payload = {
        questionResponse,
        interactionStep,
        campaignContactId,
        contact,
        campaign: sanitized_campaign,
        organization,
        previousValue,
        conversationLink:
          "https://spoke.marxwasright.org/app/1/todos/review/59845"
      };

      const api_call = nock("https://hooks.zapier.com")
        .post("/hooks/catch/9728183/buwzqtu/", JSON.stringify(expected_payload))
        .reply(200);

      await ZapierAction.processAction({
        questionResponse,
        interactionStep,
        campaignContactId,
        contact,
        campaign,
        organization,
        previousValue
      });

      expect(api_call.isDone());
    });
  });
});
