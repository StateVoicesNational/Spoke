/* eslint-disable no-unused-expressions, consistent-return */
import { r } from "../../../src/server/models/";

import {
  setupTest,
  cleanupTest,
  runComponentGql,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  createContacts,
  createTexter,
  assignTexter,
  startCampaign,
  getCampaignContact,
  getOptOut
} from "../../test_helpers";

import { createOptOutMutation } from "../../../src/components/IncomingMessageList/ConversationPreviewModal";

describe.only("createOptOut", () => {
  let testAdminUser;
  let testInvite;
  let testOrganization;
  let testCampaign;
  let testTexterUser;
  let testTexterUser2;
  let testContacts;
  let assignmentId;
  let organizationId;
  let optOutContact;
  let optOut;
  let variables;

  beforeEach(async () => {
    // Set up an entire working campaign
    await setupTest();
    testAdminUser = await createUser();
    testInvite = await createInvite();
    testOrganization = await createOrganization(testAdminUser, testInvite);
    testCampaign = await createCampaign(testAdminUser, testOrganization);
    testContacts = await createContacts(testCampaign, 100);
    testTexterUser = await createTexter(testOrganization);
    testTexterUser2 = await createTexter(testOrganization);
    await startCampaign(testAdminUser, testCampaign);

    await assignTexter(testAdminUser, testTexterUser, testCampaign);
    const dbCampaignContact = await getCampaignContact(testContacts[0].id);
    assignmentId = dbCampaignContact.assignment_id;
    organizationId = testOrganization.data.createOrganization.id;

    optOutContact = testContacts[20];
    optOut = {
      cell: optOutContact.cell,
      assignmentId,
      reason: "they were snotty"
    };

    variables = {
      optOut,
      campaignContactId: optOutContact.id,
      organizationId: organizationId.toString()
    };
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("creates an opt out when the contact is assigned to the current user", async () => {
    const optOutResult = await runComponentGql(
      createOptOutMutation,
      variables,
      testTexterUser
    );

    expect(optOutResult.data.createOptOut.id).toEqual(
      optOutContact.id.toString()
    );
    expect(optOutResult.errors).toBeUndefined();

    const dbOptOut = await getOptOut(
      parseInt(assignmentId, 10),
      optOutContact.cell
    );
    expect(dbOptOut.cell).toEqual(optOutContact.cell);
  });

  it("creates an opt out when the current user is an admin user and the contact is assigned to a different user", async () => {
    const optOutResult = await runComponentGql(
      createOptOutMutation,
      variables,
      testAdminUser
    );

    expect(optOutResult.data.createOptOut.id).toEqual(
      optOutContact.id.toString()
    );
    expect(optOutResult.errors).toBeUndefined();

    const dbOptOut = await getOptOut(
      parseInt(assignmentId, 10),
      optOutContact.cell
    );
    expect(dbOptOut.cell).toEqual(optOutContact.cell);
  });

  it("returns an error when the user attempting the optout is neither an admin nor assigned to the contact", async () => {
    const optOutResult = await runComponentGql(
      createOptOutMutation,
      variables,
      testTexterUser2
    );

    expect(optOutResult.createOptOut).toBeUndefined();
    expect(optOutResult.errors[0].message).toEqual(
      "You are not authorized to access that resource."
    );
  });
});
