/* eslint-disable no-unused-expressions, consistent-return */
import { r, Message, cacheableData } from "../../../../src/server/models/";
import { getConfig } from "../../../../src/server/api/lib/config";
import twilio, {
  postMessageSend,
  handleDeliveryReport
} from "../../../../src/server/api/lib/twilio";
import { getLastMessage } from "../../../../src/server/api/lib/message-sending";
import { erroredMessageSender } from "../../../../src/workers/job-processes";
import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization,
  setTwilioAuth,
  createCampaign,
  createContacts,
  createTexter,
  assignTexter,
  createScript,
  startCampaign,
  getCampaignContact
} from "../../../test_helpers";

let testAdminUser;
let testInvite;
let testInvite2;
let testOrganization;
let testOrganization2;
let testCampaign;
let testTexterUser;
let testContacts;
let organizationId;
let organizationId2;
let assignmentId;
let dbCampaignContact;
let queryLog;

function spokeDbListener(data) {
  if (queryLog) {
    queryLog.push(data);
  }
}

const mockAddNumberToMessagingService = jest.fn();
const mockMessageCreate = jest.fn();

jest.mock("twilio", () => {
  const uuid = require("uuid");
  return jest.fn().mockImplementation(() => ({
    availablePhoneNumbers: _ => ({
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
  }));
});

beforeEach(async () => {
  // Set up an entire working campaign
  await setupTest();
  testAdminUser = await createUser();
  testInvite = await createInvite();
  testOrganization = await createOrganization(testAdminUser, testInvite);
  organizationId = testOrganization.data.createOrganization.id;
  testCampaign = await createCampaign(testAdminUser, testOrganization);
  testContacts = await createContacts(testCampaign, 100);
  testTexterUser = await createTexter(testOrganization);
  await assignTexter(testAdminUser, testTexterUser, testCampaign);
  dbCampaignContact = await getCampaignContact(testContacts[0].id);
  assignmentId = dbCampaignContact.assignment_id;
  await createScript(testAdminUser, testCampaign);
  await startCampaign(testAdminUser, testCampaign);
  testInvite2 = await createInvite();
  testOrganization2 = await createOrganization(testAdminUser, testInvite2);
  organizationId2 = testOrganization2.data.createOrganization.id;
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
  await cleanupTest();
  if (r.redis) r.redis.flushdb();
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

  await twilio.sendMessage(message, dbCampaignContact, null, org);
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
    postMessageSend(
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
      await new Promise((resolve, reject) => {
        postMessageSend(
          message,
          dbCampaignContact,
          null,
          resolve,
          reject,
          // err, resposne
          { status: "ETIMEDOUT" },
          null
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
      postMessageSend(
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

  const [reply] = await r.knex("message").where("service_id", "TestMessageId");
  dbCampaignContact = await getCampaignContact(dbCampaignContact.id);

  expect(reply.send_status).toEqual("DELIVERED");
  expect(reply.campaign_contact_id).toEqual(dbCampaignContact.id);
  expect(reply.contact_number).toEqual(dbCampaignContact.cell);
  expect(reply.user_number).toEqual("+16465559999");
  expect(reply.messageservice_sid).toEqual("fakeSid_MK123");
  expect(dbCampaignContact.message_status).toEqual("needsResponse");
});

it("postMessageSend+erroredMessageSender network error should decrement on err/failure ", async () => {
  let message = await Message.save({
    campaign_contact_id: dbCampaignContact.id,
    messageservice_sid: "fakeSid_MK123",
    contact_number: dbCampaignContact.cell,
    is_from_contact: false,
    send_status: "SENDING",
    service: "twilio", // important since message.service is used in erroredMessageSender
    text: "twilioapitesterrortimeout <= IMPORTANT text to make this test work!",
    user_id: testTexterUser.id,
    error_code: -1 // important to start with an error
  });
  for (let i = 1; i < 7; i++) {
    const errorSendResult = await erroredMessageSender({
      delay: 1,
      maxCount: 2
    });
    if (i < 6) {
      expect(errorSendResult).toBe(1);
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
  await handleDeliveryReport({
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
  await handleDeliveryReport({
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
  const org1Auth = await cacheableData.organization.getTwilioAuth(org1);
  expect(org1Auth.authToken).toBeUndefined();
  expect(org1Auth.accountSid).toBeUndefined();

  const org2 = await cacheableData.organization.load(organizationId2);
  const org2Auth = await cacheableData.organization.getTwilioAuth(org2);
  expect(org2Auth.authToken).toBe("test_twlio_auth_token");
  expect(org2Auth.accountSid).toBe("test_twilio_account_sid");
});

describe("Number buying", () => {
  it("buys numbers in batches from twilio", async () => {
    const org2 = await cacheableData.organization.load(organizationId2);
    await twilio.buyNumbersInAreaCode(org2, "212", 35);
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

// FUTURE
// * parseMessageText
// * convertMessagePartsToMessage
// * handleIncomingMessage (JOBS_SAME_PROCESS on and off)
