/* eslint-disable no-unused-expressions, consistent-return */
import { twilioLibrary } from "../../../src/extensions/service-vendors/twilio";
import { getLastMessage } from "../../../src/extensions/service-vendors/message-sending";
import * as twilio from "../../../src/extensions/service-vendors/twilio";
import { getConfig } from "../../../src/server/api/lib/config"; // eslint-disable-line no-duplicate-imports, import/no-duplicates
import * as configFunctions from "../../../src/server/api/lib/config"; // eslint-disable-line no-duplicate-imports, import/no-duplicates
import crypto from "../../../src/extensions/secret-manager/crypto";
import {
  cacheableData,
  isSqlite,
  Message,
  r
} from "../../../src/server/models/";
import { erroredMessageSender } from "../../../src/workers/job-processes";
import {
  assignTexter,
  cleanupTest,
  createCampaign,
  createContacts,
  createInvite,
  createOrganization,
  createScript,
  createTexter,
  createUser,
  ensureOrganizationTwilioWithMessagingService,
  getCampaignContact,
  setTwilioAuth,
  setupTest,
  startCampaign
} from "../../test_helpers";

describe("twilio", () => {
  let testAdminUser;
  let testInvite;
  let testInvite2;
  let testOrganization;
  let testOrganization2;
  let testCampaign;
  let testTexterUser;
  let testContacts;
  let testAssignment;
  let organizationId;
  let organizationId2;
  let dbCampaignContact;
  let queryLog;
  let mockAddNumberToMessagingService;
  let mockMessageCreate;

  function spokeDbListener(data) {
    if (queryLog) {
      queryLog.push(data);
    }
  }

  beforeEach(async () => {
    mockAddNumberToMessagingService = jest.fn();
    mockMessageCreate = jest.fn();

    jest.spyOn(twilio, "getTwilio").mockImplementation(() => {
      // eslint-disable-next-line global-require
      const uuid = require("uuid");
      return {
        availablePhoneNumbers: () => ({
          local: {
            list: ({ areaCode, limit }) => {
              const response = [];
              for (let i = 0; i < limit; i++) {
                const last4 = limit.toString().padStart(4, "0");
                response.push({
                  phoneNumber: `+1${areaCode}XYZ${last4}`
                });
              }
              return response;
            }
          }
        }),
        incomingPhoneNumbers: {
          create: () => ({
            sid: `PNTEST${uuid.v4()}`
          })
        },
        messaging: {
          services: () => ({
            phoneNumbers: {
              create: mockAddNumberToMessagingService
            }
          })
        },
        messages: {
          create: mockMessageCreate
        }
      };
    });

    // Set up an entire working campaign
    await setupTest();
    testAdminUser = await createUser();
    testInvite = await createInvite();
    testOrganization = await createOrganization(testAdminUser, testInvite);
    organizationId = testOrganization.data.createOrganization.id;
    testCampaign = await createCampaign(testAdminUser, testOrganization);
    testContacts = await createContacts(testCampaign, 100);
    testTexterUser = await createTexter(testOrganization);
    testAssignment = await assignTexter(
      testAdminUser,
      testTexterUser,
      testCampaign
    );
    dbCampaignContact = await getCampaignContact(testContacts[0].id);
    await createScript(testAdminUser, testCampaign);
    await startCampaign(testAdminUser, testCampaign);
    testInvite2 = await createInvite();
    testOrganization2 = await createOrganization(testAdminUser, testInvite2);
    organizationId2 = testOrganization2.data.createOrganization.id;
    await ensureOrganizationTwilioWithMessagingService(testOrganization);
    await ensureOrganizationTwilioWithMessagingService(testOrganization2);
    await setTwilioAuth(testAdminUser, testOrganization2);

    // use caching
    await cacheableData.organization.load(organizationId);
    await cacheableData.campaign.load(testCampaign.id, { forceLoad: true });

    queryLog = [];
    r.knex.on("query", spokeDbListener);
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    queryLog = null;
    r.knex.removeListener("query", spokeDbListener);
    jest.restoreAllMocks();
    await cleanupTest();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("should send messages", async () => {
    let message = await Message.save({
      campaign_contact_id: dbCampaignContact.id,
      messageservice_sid: "test_message_service",
      contact_number: dbCampaignContact.cell,
      is_from_contact: false,
      send_status: "SENDING",
      service: "twilio",
      text: "blah blah blah",
      user_id: testTexterUser.id
    });

    await setTwilioAuth(testAdminUser, testOrganization);
    const org = await cacheableData.organization.load(organizationId);

    mockMessageCreate.mockImplementation((payload, cb) => {
      cb(null, { sid: "SM12345", error_code: null });
    });

    await twilio.sendMessage({
      message,
      contact: dbCampaignContact,
      organization: org
    });
    expect(mockMessageCreate).toHaveBeenCalledTimes(1);
    const arg = mockMessageCreate.mock.calls[0][0];
    expect(arg).toMatchObject({
      to: dbCampaignContact.cell,
      body: "blah blah blah",
      messagingServiceSid: "test_message_service"
    });

    message = await Message.get(message.id);
    expect(message).toMatchObject({
      service_id: "SM12345",
      send_status: "SENT"
    });
  });

  it("postMessageSend success should save message and update contact state", async () => {
    const message = await Message.save({
      campaign_contact_id: dbCampaignContact.id,
      messageservice_sid: "fakeSid_MK123",
      contact_number: dbCampaignContact.cell,
      is_from_contact: false,
      send_status: "SENDING",
      service: "twilio",
      text: "some message",
      user_id: testTexterUser.id
    });
    const updatedMessage = await new Promise((resolve, reject) => {
      twilio.postMessageSend(
        message,
        dbCampaignContact,
        null,
        resolve,
        reject,
        // err, resposne
        null,
        { sid: "1234", error_code: null }
      );
    });
    expect(updatedMessage.send_status).toEqual("SENT");
    expect(Number(updatedMessage.sent_at) > Number(new Date()) - 1000).toEqual(
      true
    );
  });

  it("postMessageSend network error should decrement on err/failure ", async () => {
    let message = await Message.save({
      campaign_contact_id: dbCampaignContact.id,
      messageservice_sid: "fakeSid_MK123",
      contact_number: dbCampaignContact.cell,
      is_from_contact: false,
      send_status: "SENDING",
      service: "twilio",
      text: "some message",
      user_id: testTexterUser.id
    });
    for (let i = 1; i < 7; i++) {
      // We loop MAX_SEND_ATTEMPTS + 1 times (starting at i=1!
      // The last time, the send_status should update to "ERROR" (so we don't keep trying)
      try {
        // eslint-disable-next-line no-loop-func
        await new Promise((resolve, reject) => {
          twilio.postMessageSend(
            message,
            dbCampaignContact,
            null,
            resolve,
            reject,
            // err, resposne
            { status: "ETIMEDOUT" },
            null,
            null,
            null,
            {
              maxSendAttempts: twilio.MAX_SEND_ATTEMPTS,
              serviceName: "twilio"
            }
          );
        });
        expect("above statement to throw error w/ reject").toEqual(true);
      } catch (err) {
        dbCampaignContact = await getCampaignContact(dbCampaignContact.id);
        message = await Message.get(message.id);

        expect(dbCampaignContact.error_code).toEqual(-i);
        expect(message.error_code).toEqual(-i);
        expect(message.send_status).toEqual(i < 6 ? "SENDING" : "ERROR");
      }
    }
  });

  it("postMessageSend error from twilio response should fail immediately", async () => {
    let message = await Message.save({
      campaign_contact_id: dbCampaignContact.id,
      messageservice_sid: "fakeSid_MK123",
      contact_number: dbCampaignContact.cell,
      is_from_contact: false,
      send_status: "SENDING",
      service: "twilio",
      text: "some message",
      user_id: testTexterUser.id
    });
    try {
      await new Promise((resolve, reject) => {
        twilio.postMessageSend(
          message,
          dbCampaignContact,
          null,
          resolve,
          reject,
          // err, resposne
          null,
          { sid: "1234", error_code: 11200 }
        );
      });
      expect("above statement to throw error w/ reject").toEqual(true);
    } catch (err) {
      dbCampaignContact = await getCampaignContact(dbCampaignContact.id);
      message = await Message.get(message.id);

      expect(dbCampaignContact.error_code).toEqual(11200);
      expect(message.error_code).toEqual(11200);
      expect(message.send_status).toEqual("ERROR");
    }
  });

  it("handleIncomingMessage should save message and update contact state", async () => {
    // use caching
    const org = await cacheableData.organization.load(organizationId);
    const campaign = await cacheableData.campaign.load(testCampaign.id, {
      forceLoad: true
    });
    // load assignment into cache
    const assn = await cacheableData.assignment.load(
      testAssignment.data.editCampaign.assignments[0].id
    );
    await cacheableData.campaignContact.loadMany(campaign, org, {});
    queryLog = [];
    await cacheableData.message.save({
      contact: dbCampaignContact,
      messageInstance: new Message({
        campaign_contact_id: dbCampaignContact.id,
        contact_number: dbCampaignContact.cell,
        messageservice_sid: "fakeSid_MK123",
        is_from_contact: false,
        send_status: "SENT",
        service: "twilio",
        text: "some message",
        user_id: testTexterUser.id,
        service_id: "123123123"
      })
    });

    const lastMessage = await getLastMessage({
      contactNumber: dbCampaignContact.cell,
      service: "twilio",
      messageServiceSid: "fakeSid_MK123"
    });

    expect(lastMessage.campaign_contact_id).toEqual(dbCampaignContact.id);
    await twilio.handleIncomingMessage({
      From: dbCampaignContact.cell,
      To: "+16465559999",
      MessageSid: "TestMessageId",
      Body: "Fake reply",
      MessagingServiceSid: "fakeSid_MK123"
    });

    if (r.redis && getConfig("REDIS_CONTACT_CACHE")) {
      // IMPORTANT: this should be tested before we do SELECT statements below
      //   in the test itself to check the database
      const selectMethods = { select: 1, first: 1 };
      const selectCalls = queryLog.filter(q => q.method in selectMethods);
      // NO select statements should have fired!
      expect(selectCalls).toEqual([]);
    }

    const [reply] = await r
      .knex("message")
      .where("service_id", "TestMessageId");
    dbCampaignContact = await getCampaignContact(dbCampaignContact.id);

    expect(reply.send_status).toEqual("DELIVERED");
    expect(reply.campaign_contact_id).toEqual(dbCampaignContact.id);
    expect(reply.contact_number).toEqual(dbCampaignContact.cell);
    expect(reply.user_number).toEqual("+16465559999");
    expect(reply.messageservice_sid).toEqual("fakeSid_MK123");
    expect(dbCampaignContact.message_status).toEqual("needsResponse");
  });

  it("postMessageSend+erroredMessageSender network error should decrement on err/failure ", async () => {
    await Message.save({
      campaign_contact_id: dbCampaignContact.id,
      messageservice_sid: "fakeSid_MK123",
      contact_number: dbCampaignContact.cell,
      is_from_contact: false,
      send_status: "SENDING",
      service: "twilio", // important since message.service is used in erroredMessageSender
      text:
        "twilioapitesterrortimeout <= IMPORTANT text to make this test work!",
      user_id: testTexterUser.id,
      error_code: -1 // important to start with an error
    });
    for (let i = 1; i < 7; i++) {
      const errorSendResult = await erroredMessageSender({
        delay: 1,
        maxCount: 2
      });
      if (i < 6) {
        // Currently an open issue w/ datetime being stored as a string in SQLite3 for Jest tests: https://github.com/TryGhost/node-sqlite3/issues/1355. This inaccurately affects the result of the below test
        if (!isSqlite) {
          expect(errorSendResult).toBe(1);
        }
      } else {
        expect(errorSendResult).toBe(0);
      }
    }
  });

  it("handleDeliveryReport delivered", async () => {
    const org = await cacheableData.organization.load(organizationId);
    let campaign = await cacheableData.campaign.load(testCampaign.id, {
      forceLoad: true
    });
    await cacheableData.campaignContact.loadMany(campaign, org, {});
    queryLog = [];

    const messageSid = "123123123";
    await cacheableData.message.save({
      contact: dbCampaignContact,
      messageInstance: new Message({
        campaign_contact_id: dbCampaignContact.id,
        contact_number: dbCampaignContact.cell,
        messageservice_sid: "fakeSid_MK123",
        is_from_contact: false,
        send_status: "SENT",
        service: "twilio",
        text: "some message",
        user_id: testTexterUser.id,
        service_id: messageSid
      })
    });
    await twilio.handleDeliveryReport({
      MessageSid: messageSid,
      MessagingServiceSid: "fakeSid_MK123",
      To: dbCampaignContact.cell,
      MessageStatus: "delivered",
      From: "+14145551010"
    });

    const messages = await r.knex("message").where("service_id", messageSid);
    expect(messages.length).toBe(1);
    expect(messages[0].error_code).toBe(null);
    expect(messages[0].send_status).toBe("DELIVERED");

    const contacts = await r
      .knex("campaign_contact")
      .where("id", dbCampaignContact.id);

    expect(contacts.length).toBe(1);
    expect(contacts[0].error_code).toBe(null);

    if (r.redis) {
      campaign = await cacheableData.campaign.load(testCampaign.id);
      expect(campaign.errorCount).toBe(null);
    }
  });

  it("handleDeliveryReport error", async () => {
    const org = await cacheableData.organization.load(organizationId);
    let campaign = await cacheableData.campaign.load(testCampaign.id, {
      forceLoad: true
    });
    await cacheableData.campaignContact.loadMany(campaign, org, {});
    queryLog = [];

    const messageSid = "123123123";
    await cacheableData.message.save({
      contact: dbCampaignContact,
      messageInstance: new Message({
        campaign_contact_id: dbCampaignContact.id,
        contact_number: dbCampaignContact.cell,
        messageservice_sid: "fakeSid_MK123",
        is_from_contact: false,
        send_status: "SENT",
        service: "twilio",
        text: "some message",
        user_id: testTexterUser.id,
        service_id: messageSid
      })
    });
    await twilio.handleDeliveryReport({
      MessageSid: messageSid,
      MessagingServiceSid: "fakeSid_MK123",
      To: dbCampaignContact.cell,
      MessageStatus: "failed",
      From: "+14145551010",
      ErrorCode: "98989"
    });

    const messages = await r.knex("message").where("service_id", messageSid);
    expect(messages.length).toBe(1);
    expect(messages[0].error_code).toBe(98989);
    expect(messages[0].send_status).toBe("ERROR");

    const contacts = await r
      .knex("campaign_contact")
      .where("id", dbCampaignContact.id);

    expect(contacts.length).toBe(1);
    expect(contacts[0].error_code).toBe(98989);

    if (r.redis) {
      campaign = await cacheableData.campaign.load(testCampaign.id);
      expect(campaign.errorCount).toBe("1");
    }
  });

  it("orgs should have separate twilio credentials", async () => {
    const org1 = await cacheableData.organization.load(organizationId);
    const org1Auth = await cacheableData.organization.getMessageServiceConfig(
      org1
    );
    expect(org1Auth.authToken).toBeUndefined();
    expect(org1Auth.accountSid).toBeUndefined();

    const org2 = await cacheableData.organization.load(organizationId2);
    const org2Auth = await cacheableData.organization.getMessageServiceConfig(
      org2
    );
    expect(org2Auth.authToken).toBe("<Encrypted>");
    expect(org2Auth.accountSid).toBe("ACtest_twilio_account_sid");
  });

  describe("Number buying", () => {
    it("buys numbers in batches from twilio", async () => {
      const org2 = await cacheableData.organization.load(organizationId2);
      await twilio.buyNumbersInAreaCode(org2, "212", 35, {
        skipOrgMessageService: true
      });
      const inventoryCount = await r.getCount(
        r.knex("owned_phone_number").where({
          area_code: "212",
          organization_id: organizationId2,
          allocated_to: null
        })
      );

      expect(inventoryCount).toEqual(35);
    });

    it("optionally adds them to a messaging service", async () => {
      const org2 = await cacheableData.organization.load(organizationId2);
      await twilio.buyNumbersInAreaCode(org2, "917", 12, {
        messagingServiceSid: "MG123FAKE"
      });
      const inventoryCount = await r.getCount(
        r.knex("owned_phone_number").where({
          area_code: "917",
          organization_id: organizationId2,
          allocated_to: "messaging_service",
          allocated_to_id: "MG123FAKE"
        })
      );
      expect(mockAddNumberToMessagingService).toHaveBeenCalledTimes(12);
      expect(inventoryCount).toEqual(12);
    });
  });
});

describe("config functions", () => {
  let twilioConfig;
  let encryptedTwilioConfig;
  let organization;
  let fakeAuthToken;
  let fakeAccountSid;
  let fakeMessageServiceSid;
  let encryptedFakeAuthToken;
  let fakeApiKey;
  let hiddenPlaceholder;
  let encryptedPlaceHolder;
  beforeEach(async () => {
    hiddenPlaceholder = "<Hidden>";
    encryptedPlaceHolder = "<Encrypted>";
    fakeAuthToken = "fake_twilio_auth_token";
    fakeAccountSid = "fake_twilio_account_sid";
    fakeMessageServiceSid = "fake_twilio_message_service_sid";
    encryptedFakeAuthToken = crypto.symmetricEncrypt(fakeAuthToken);
    fakeApiKey = "fake_twilio_api_key";
    organization = { feature: { TWILIO_AUTH_TOKEN: "should_be_ignored" } };
    twilioConfig = {
      TWILIO_AUTH_TOKEN: fakeAuthToken,
      TWILIO_ACCOUNT_SID: fakeAccountSid,
      TWILIO_MESSAGE_SERVICE_SID: fakeMessageServiceSid
    };
    encryptedTwilioConfig = {
      TWILIO_AUTH_TOKEN_ENCRYPTED: encryptedFakeAuthToken,
      TWILIO_ACCOUNT_SID: fakeAccountSid,
      TWILIO_MESSAGE_SERVICE_SID: fakeMessageServiceSid
    };
    jest
      .spyOn(crypto, "symmetricEncrypt")
      .mockReturnValue(encryptedFakeAuthToken);
  });
  afterEach(async () => {
    jest.restoreAllMocks();
  });
  describe("getServiceConfig", () => {
    let expectedConfig;
    beforeEach(async () => {
      expectedConfig = {
        authToken: hiddenPlaceholder,
        accountSid: fakeAccountSid,
        messageServiceSid: fakeMessageServiceSid
      };
    });
    it("returns the config elements", async () => {
      const config = await twilio.getServiceConfig(twilioConfig, organization);
      expect(config).toEqual(expectedConfig);
    });
    describe("when obscureSensitiveInformation is true", () => {
      it("returns authToken obscured", async () => {
        const config = await twilio.getServiceConfig(
          twilioConfig,
          organization,
          { obscureSensitiveInformation: true }
        );
        expect(config).toEqual({
          ...expectedConfig,
          authToken: hiddenPlaceholder
        });
      });
    });
    describe("when the auth token is encrypted", () => {
      it("returns the config elements", async () => {
        const config = await twilio.getServiceConfig(
          encryptedTwilioConfig,
          organization
        );
        expect(config).toEqual({
          ...expectedConfig,
          authToken: encryptedPlaceHolder
        });
      });
      describe("when obscureSensitiveInformation is true", () => {
        it("returns authToken obscured", async () => {
          const config = await twilio.getServiceConfig(
            twilioConfig,
            organization,
            { obscureSensitiveInformation: true }
          );
          expect(config).toEqual({
            ...expectedConfig,
            authToken: hiddenPlaceholder
          });
        });
      });
    });
    describe("when it has an API key instead of account sid", () => {
      beforeEach(async () => {
        twilioConfig.TWILIO_API_KEY = fakeApiKey;
        delete twilioConfig.TWILIO_ACCOUNT_SID;
      });
      it("returns the config elements", async () => {
        const config = await twilio.getServiceConfig(
          twilioConfig,
          organization
        );
        expect(config).toEqual({
          ...expectedConfig,
          authToken: hiddenPlaceholder,
          accountSid: fakeApiKey
        });
      });
    });
    describe("when using legacy config -- all the elements are at the top level", () => {
      let fakeConfigs;
      let expectedConfigOpts;
      beforeEach(async () => {
        organization = { feature: { ...twilioConfig } };
        expectedConfigOpts = { onlyLocal: false };
        jest.spyOn(configFunctions, "getConfig");
        jest.spyOn(configFunctions, "hasConfig");
      });
      it("returns the config ", async () => {
        const config = await twilio.getServiceConfig(undefined, organization);
        expect(config).toEqual({
          ...expectedConfig,
          authToken: hiddenPlaceholder
        });
        expect(configFunctions.hasConfig.mock.calls).toEqual([
          ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
          ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
          ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
        ]);
        expect(configFunctions.getConfig.mock.calls).toEqual([
          ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
          ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
          ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
          ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
          ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
        ]);
      });
      describe("where there is no config whatsoever", () => {
        beforeEach(async () => {
          organization = { feature: {} };
          configFunctions.getConfig.mockReturnValue(undefined);
        });
        it("returns nothing", async () => {
          const config = await twilio.getServiceConfig(undefined, organization);
          expect(config).toEqual({});
        });
      });
      describe("when there is no org-specific config", () => {
        beforeEach(async () => {
          organization = { feature: {} };
          fakeConfigs = twilioConfig;
          configFunctions.getConfig.mockImplementation(key => fakeConfigs[key]);
        });
        it("returns global config", async () => {
          const config = await twilio.getServiceConfig(undefined, organization);
          expect(config).toEqual({
            ...expectedConfig
          });
          expect(configFunctions.hasConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
          ]);
          expect(configFunctions.getConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
          ]);
        });
      });
      describe("when obscureSensitiveInformation is true", () => {
        it("returns authToken obscured", async () => {
          const config = await twilio.getServiceConfig(
            undefined,
            organization,
            { obscureSensitiveInformation: true }
          );
          expect(config).toEqual(expectedConfig);
          expect(configFunctions.hasConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
          ]);
          expect(configFunctions.getConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
          ]);
        });
      });
      describe("when obscureSensitiveInformation is false", () => {
        it("returns authToken unobscured", async () => {
          const config = await twilio.getServiceConfig(
            undefined,
            organization,
            { obscureSensitiveInformation: false }
          );
          expect(config).toEqual({
            ...expectedConfig,
            authToken: fakeAuthToken
          });
          expect(configFunctions.hasConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
          ]);
          expect(configFunctions.getConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
          ]);
        });
      });

      it("obscures senstive information by default", async () => {
        const config = await twilio.getServiceConfig(undefined, organization);
        expect(config).toEqual(expectedConfig);
        expect(configFunctions.hasConfig.mock.calls).toEqual([
          ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
          ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
          ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
        ]);
        expect(configFunctions.getConfig.mock.calls).toEqual([
          ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
          ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
          ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
          ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
          ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
        ]);
      });
      describe("when restrictToOrgFeatures is false", () => {
        beforeEach(async () => {
          expectedConfigOpts = { onlyLocal: false };
          configFunctions.getConfig.mockRestore();
          jest.spyOn(configFunctions, "getConfig");
        });
        it("passes { onlyLocal: true } to hasConfig and getConfig", async () => {
          await twilio.getServiceConfig(undefined, organization, {
            restrictToOrgFeatures: false
          });
          expect(configFunctions.hasConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
          ]);
          expect(configFunctions.getConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
          ]);
        });
      });
      describe("when restrictToOrgFeatures is true", () => {
        beforeEach(async () => {
          expectedConfigOpts = { onlyLocal: true };
          configFunctions.getConfig.mockRestore();
          jest.spyOn(configFunctions, "getConfig");
        });
        it("passes { onlyLocal: true } to hasConfig and getConfig", async () => {
          await twilio.getServiceConfig(undefined, organization, {
            restrictToOrgFeatures: true
          });
          expect(configFunctions.hasConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
          ]);
          expect(configFunctions.getConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
          ]);
        });
      });
      describe("when the auth token is encrypted", () => {
        beforeEach(async () => {
          organization = { feature: { ...encryptedTwilioConfig } };
        });
        describe("when obscureSensitiveInformation is true", () => {
          it("returns authToken obscured", async () => {
            const config = await twilio.getServiceConfig(
              undefined,
              organization,
              { obscureSensitiveInformation: true }
            );
            expect(config).toEqual({
              ...expectedConfig,
              authToken: encryptedPlaceHolder
            });
            expect(configFunctions.hasConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
            ]);
            expect(configFunctions.getConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
            ]);
          });
        });
        describe("when obscureSensitiveInformation is false", () => {
          it("returns authToken unobscured", async () => {
            const config = await twilio.getServiceConfig(
              undefined,
              organization,
              { obscureSensitiveInformation: false }
            );
            expect(config).toEqual({
              ...expectedConfig,
              authToken: fakeAuthToken
            });
            expect(configFunctions.hasConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
            ]);
            expect(configFunctions.getConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
            ]);
          });
        });
      });
      describe("when the auth token is not encrypted", () => {
        beforeEach(async () => {
          organization = { feature: { ...twilioConfig } };
        });
        describe("when obscureSensitiveInformation is false", () => {
          it("returns authToken unobscured", async () => {
            const config = await twilio.getServiceConfig(
              undefined,
              organization,
              { obscureSensitiveInformation: false }
            );
            expect(config).toEqual({
              ...expectedConfig,
              authToken: fakeAuthToken
            });
            expect(configFunctions.hasConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
            ]);
            expect(configFunctions.getConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
              ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
            ]);
          });
        });
        describe("when obscureSensitiveInformation is true", () => {
          it("returns authToken obscured", async () => {
            const config = await twilio.getServiceConfig(
              undefined,
              organization,
              { obscureSensitiveInformation: true }
            );
            expect(config).toEqual({
              ...expectedConfig,
              authToken: hiddenPlaceholder
            });
            expect(configFunctions.hasConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
            ]);
            expect(configFunctions.getConfig.mock.calls).toEqual([
              ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
              ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
              ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
            ]);
          });
        });
      });
      describe("when it has an API key instead of account sid", () => {
        beforeEach(async () => {
          twilioConfig.TWILIO_API_KEY = fakeApiKey;
          delete twilioConfig.TWILIO_ACCOUNT_SID;
          const feature = { ...twilioConfig };
          organization = { feature };
        });
        it("returns the config elements", async () => {
          const config = await twilio.getServiceConfig(undefined, organization);
          expect(config).toEqual({ ...expectedConfig, accountSid: fakeApiKey });
          expect(configFunctions.hasConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts]
          ]);
          expect(configFunctions.getConfig.mock.calls).toEqual([
            ["TWILIO_AUTH_TOKEN_ENCRYPTED", organization, expectedConfigOpts],
            ["TWILIO_AUTH_TOKEN", organization, expectedConfigOpts],
            ["TWILIO_ACCOUNT_SID", organization, expectedConfigOpts],
            ["TWILIO_API_KEY", organization, expectedConfigOpts],
            ["TWILIO_MESSAGE_SERVICE_SID", organization, expectedConfigOpts]
          ]);
        });
      });
    });
  });
  describe("getMessageServiceSid", () => {
    beforeEach(async () => {
      organization = { feature: { message_service_twilio: twilioConfig } };
    });
    it("returns the sid", async () => {
      const sid = await twilio.getMessageServiceSid(
        organization,
        undefined,
        undefined
      );
      expect(sid).toEqual(fakeMessageServiceSid);
    });
    describe("when using legacy config -- all the elements are at the top level", () => {
      beforeEach(async () => {
        organization = { feature: { ...twilioConfig } };
      });
      it("returns the sid", async () => {
        const sid = await twilio.getMessageServiceSid(
          organization,
          undefined,
          undefined
        );
        expect(sid).toEqual(fakeMessageServiceSid);
      });
    });
  });
  describe("updateConfig", () => {
    let twilioApiAccountsListMock;
    let oldConfig;
    let newConfig;
    let expectedConfig;
    let globalTestEnvironment;
    beforeEach(async () => {
      globalTestEnvironment = global.TEST_ENVIRONMENT;
      global.TEST_ENVIRONMENT = 0;

      oldConfig = "__IGNORED__";
      newConfig = {
        twilioAccountSid: fakeAccountSid,
        twilioMessageServiceSid: fakeMessageServiceSid,
        twilioAuthToken: fakeAuthToken
      };

      expectedConfig = {
        TWILIO_ACCOUNT_SID: fakeAccountSid,
        TWILIO_AUTH_TOKEN_ENCRYPTED: `default-encrypt|${encryptedFakeAuthToken}`,
        TWILIO_MESSAGE_SERVICE_SID: fakeMessageServiceSid
      };

      twilioApiAccountsListMock = jest.fn().mockResolvedValue({});
      jest.spyOn(twilioLibrary, "Twilio").mockReturnValue({
        api: { accounts: { list: twilioApiAccountsListMock } }
      });
    });

    afterEach(async () => {
      global.TEST_ENVIRONMENT = globalTestEnvironment;
    });

    it("delegates to its dependencies and returns the new config", async () => {
      const returnedConfig = await twilio.updateConfig(oldConfig, newConfig);
      expect(returnedConfig).toEqual(expectedConfig);
      expect(crypto.symmetricEncrypt.mock.calls).toEqual([
        ["fake_twilio_auth_token"]
      ]);
      expect(twilioLibrary.Twilio.mock.calls).toEqual([
        [fakeAccountSid, fakeAuthToken]
      ]);
      expect(twilioApiAccountsListMock.mock.calls).toEqual([[]]);
    });
    describe("when the new config doesn't contain required elements", () => {
      beforeEach(async () => {
        delete newConfig.twilioAccountSid;
      });
      it("throws an exception", async () => {
        let error;
        try {
          await twilio.updateConfig(oldConfig, newConfig);
        } catch (caught) {
          error = caught;
        }
        expect(error.message).toEqual("twilioAccountSid is required");
        expect(crypto.symmetricEncrypt).not.toHaveBeenCalled();
        expect(twilioLibrary.Twilio).not.toHaveBeenCalled();
        expect(twilioApiAccountsListMock).not.toHaveBeenCalled();
      });
    });
    describe("when the twilio credentials are invalid", () => {
      beforeEach(async () => {
        twilioApiAccountsListMock = jest.fn().mockImplementation(() => {
          throw new Error("OH NO!");
        });
        jest.spyOn(twilioLibrary, "Twilio").mockReturnValue({
          api: { accounts: { list: twilioApiAccountsListMock } }
        });
      });
      it("throws an exception", async () => {
        let error;
        try {
          await twilio.updateConfig(oldConfig, newConfig);
        } catch (caught) {
          error = caught;
        }
        expect(error.message).toEqual("Invalid Twilio credentials");
      });
    });
  });
  describe("campaignNumbersEnabled", () => {
    beforeEach(async () => {
      organization = {
        feature: {
          EXPERIMENTAL_PHONE_INVENTORY: true,
          PHONE_INVENTORY: true,
          EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS: true
        }
      };
    });

    it("returns true when all the configs are true", async () => {
      expect(twilio.campaignNumbersEnabled(organization)).toEqual(true);
    });
    describe("when EXPERIMENTAL_PHONE_INVENTORY is false", () => {
      beforeEach(async () => {
        organization.feature.EXPERIMENTAL_PHONE_INVENTORY = false;
      });

      it("returns true", async () => {
        expect(twilio.campaignNumbersEnabled(organization)).toEqual(true);
      });
    });
    describe("when PHONE_INVENTORY is false", () => {
      beforeEach(async () => {
        organization.feature.PHONE_INVENTORY = false;
      });

      it("returns true", async () => {
        expect(twilio.campaignNumbersEnabled(organization)).toEqual(true);
      });
    });
    describe("when EXPERIMENTAL_PHONE_INVENTORY and PHONE_INVENTORY are both false", () => {
      beforeEach(async () => {
        organization.feature.PHONE_INVENTORY = false;
        organization.feature.EXPERIMENTAL_PHONE_INVENTORY = false;
      });

      it("returns false", async () => {
        expect(twilio.campaignNumbersEnabled(organization)).toEqual(false);
      });
    });
    describe("when EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS is false", () => {
      beforeEach(async () => {
        organization.feature.EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS = false;
      });

      it("returns false", async () => {
        expect(twilio.campaignNumbersEnabled(organization)).toEqual(false);
      });
    });
  });
  describe("manualMessagingServicesEnabled", () => {
    beforeEach(async () => {
      organization = {
        feature: {
          EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE: true
        }
      };
    });

    it("it returns true with the config is true", async () => {
      expect(twilio.manualMessagingServicesEnabled(organization)).toEqual(true);
    });

    describe("when the config is false", () => {
      beforeEach(async () => {
        organization.feature.EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE = false;
      });
      it("returns flse", async () => {
        expect(twilio.manualMessagingServicesEnabled(organization)).toEqual(
          false
        );
      });
    });
  });
  describe("fullyConfigured", () => {
    beforeEach(async () => {
      jest.spyOn(twilio, "getServiceConfig").mockResolvedValue({
        authToken: "fake_auth_token",
        accountSid: "fake_account_sid"
      });
      jest
        .spyOn(twilio, "manualMessagingServicesEnabled")
        .mockReturnValue(true);
      jest.spyOn(twilio, "campaignNumbersEnabled").mockReturnValue(true);
      jest
        .spyOn(twilio, "getMessageServiceSid")
        .mockResolvedValue("fake_message_service_sid");
    });
    it("fullyConfigured returns true", async () => {
      expect(await twilio.fullyConfigured("everything_is_mocked")).toEqual(
        true
      );
      expect(twilio.getMessageServiceSid).not.toHaveBeenCalled();
    });
    describe("when getServiceConfig doesn't return a full configuration", () => {
      beforeEach(async () => {
        jest.spyOn(twilio, "getServiceConfig").mockResolvedValue({
          authToken: "fake_auth_token"
        });
      });
      it("returns false", async () => {
        expect(await twilio.fullyConfigured("everything_is_mocked")).toEqual(
          false
        );
        expect(twilio.manualMessagingServicesEnabled).not.toHaveBeenCalled();
        expect(twilio.campaignNumbersEnabled).not.toHaveBeenCalled();
        expect(twilio.getMessageServiceSid).not.toHaveBeenCalled();
      });
    });
    describe("when manualmessagingServicesEnabled returns false", () => {
      beforeEach(async () => {
        jest
          .spyOn(twilio, "manualMessagingServicesEnabled")
          .mockReturnValue(false);
      });
      it("returns true", async () => {
        expect(await twilio.fullyConfigured("everything_is_mocked")).toEqual(
          true
        );
        expect(twilio.getMessageServiceSid).not.toHaveBeenCalled();
      });
    });
    describe("when campaignNumbersEnabled returns false", () => {
      beforeEach(async () => {
        jest.spyOn(twilio, "campaignNumbersEnabled").mockReturnValue(false);
      });
      it("returns true", async () => {
        expect(await twilio.fullyConfigured("everything_is_mocked")).toEqual(
          true
        );
        expect(twilio.getMessageServiceSid).not.toHaveBeenCalled();
      });
    });
    describe("when manualMessagingServiceEnabled and campaignNumbersEnabled both return false", () => {
      beforeEach(async () => {
        jest
          .spyOn(twilio, "manualMessagingServicesEnabled")
          .mockReturnValue(false);
        jest.spyOn(twilio, "campaignNumbersEnabled").mockReturnValue(false);
      });
      describe("when getMessageServiceSid returns true", () => {
        it("returns true", async () => {
          expect(await twilio.fullyConfigured("everything_is_mocked")).toEqual(
            true
          );
          expect(twilio.getMessageServiceSid.mock.calls).toEqual([
            ["everything_is_mocked"]
          ]);
        });
      });
      describe("when getMessageServiceSid returns null", () => {
        beforeEach(async () => {
          jest.spyOn(twilio, "getMessageServiceSid").mockResolvedValue(null);
        });
        it("returns false", async () => {
          expect(await twilio.fullyConfigured("everything_is_mocked")).toEqual(
            false
          );
          expect(twilio.getMessageServiceSid.mock.calls).toEqual([
            ["everything_is_mocked"]
          ]);
        });
      });
    });
  });
});
// FUTURE
// * parseMessageText
// * convertMessagePartsToMessage
// * handleIncomingMessage (JOBS_SAME_PROCESS on and off)
