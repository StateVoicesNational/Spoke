/* eslint-disable no-unused-expressions, consistent-return */
import { r, Message, cacheableData } from "../../../../src/server/models/";
import { postMessageSend } from "../../../../src/server/api/lib/twilio";
import twilio from "../../../../src/server/api/lib/twilio";
import { getLastMessage } from "../../../../src/server/api/lib/message-sending";
import { erroredMessageSender } from "../../../../src/workers/job-processes";
import {
  setupTest,
  cleanupTest,
  runComponentGql,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  saveCampaign,
  copyCampaign,
  createContacts,
  createTexter,
  assignTexter,
  createScript,
  startCampaign,
  getCampaignContact,
  sendMessage
} from "../../../test_helpers";

let testAdminUser;
let testInvite;
let testOrganization;
let testCampaign;
let testTexterUser;
let testTexterUser2;
let testContacts;
let organizationId;
let assignmentId;
let dbCampaignContact;
let queryLog;

function spokeDbListener(data) {
  if (queryLog) {
    queryLog.push(data);
  }
}

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

  if (r.redis) {
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

// FUTURE
// * handleDeliveryReport (error and non-error)
// * parseMessageText
// * convertMessagePartsToMessage
// * handleIncomingMessage (JOBS_SAME_PROCESS on and off)
