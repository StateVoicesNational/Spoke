/* eslint-disable no-unused-expressions, consistent-return */
import { r, Message } from "../../../../src/server/models/";
import { postMessageSend } from "../../../../src/server/api/lib/twilio";

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
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

afterEach(async () => {
  await cleanupTest();
  if (r.redis) r.redis.flushdb();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

it("postMessageSend success should save message and update contact state", async () => {
  const message = await Message.save({
    assignment_id: assignmentId,
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
    assignment_id: assignmentId,
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
    assignment_id: assignmentId,
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

// FUTURE
// * handleDeliveryReport (error and non-error)
// * parseMessageText
// * convertMessagePartsToMessage
// * handleIncomingMessage (JOBS_SAME_PROCESS on and off)
