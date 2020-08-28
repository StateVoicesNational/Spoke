/* eslint-disable no-unused-expressions, consistent-return */
import { r } from "../../../src/server/models/";

import {
  setupTest,
  cleanupTest,
  runGql,
  createStartedCampaign,
  getOptOut
} from "../../test_helpers";

import { createOptOutGql } from "../../../src/components/IncomingMessageList/ConversationPreviewModal";

describe("createOptOut", () => {
  let startedCampaign;
  let optOutContact;
  let optOut;
  let variables;

  beforeEach(async () => {
    // Set up an entire working campaign
    await setupTest();

    startedCampaign = await createStartedCampaign();

    optOutContact = startedCampaign.testContacts[20];
    optOut = {
      cell: optOutContact.cell,
      assignmentId: startedCampaign.assignmentId,
      reason: "they were snotty"
    };

    variables = {
      optOut,
      campaignContactId: optOutContact.id
    };
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("creates an opt out when the contact is assigned to the current user", async () => {
    const optOutResult = await runGql(
      createOptOutGql,
      variables,
      startedCampaign.testTexterUser
    );

    expect(optOutResult.data.createOptOut.id).toEqual(
      optOutContact.id.toString()
    );
    expect(optOutResult.errors).toBeUndefined();

    const dbOptOut = await getOptOut(
      parseInt(startedCampaign.assignmentId, 10),
      optOutContact.cell
    );
    expect(dbOptOut.cell).toEqual(optOutContact.cell);
  });

  it("creates an opt out when the current user is an admin user and the contact is assigned to a different user", async () => {
    const optOutResult = await runGql(
      createOptOutGql,
      variables,
      startedCampaign.testAdminUser
    );

    expect(optOutResult.data.createOptOut.id).toEqual(
      optOutContact.id.toString()
    );
    expect(optOutResult.errors).toBeUndefined();

    const dbOptOut = await getOptOut(
      parseInt(startedCampaign.assignmentId, 10),
      optOutContact.cell
    );
    expect(dbOptOut.cell).toEqual(optOutContact.cell);
  });

  it("returns an error when the user attempting the optout is neither an admin nor assigned to the contact", async () => {
    const optOutResult = await runGql(
      createOptOutGql,
      variables,
      startedCampaign.testTexterUser2
    );

    expect(optOutResult.createOptOut).toBeUndefined();
    expect(optOutResult.errors[0].message).toEqual(
      "You are not authorized to access that resource."
    );
  });
});
