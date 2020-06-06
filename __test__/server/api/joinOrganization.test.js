import { r } from "../../../src/server/models/";

import {
  setupTest,
  cleanupTest,
  runGql,
  createUser,
  createStartedCampaign
} from "../../test_helpers";

describe("joinOrganization", () => {
  let startedCampaign;

  beforeEach(async () => {
    // Set up an entire working campaign
    await setupTest();
    startedCampaign = await createStartedCampaign();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("should add texters to a organization", async () => {
    const testTexterUser = await createUser({
      auth0_id: "test456",
      first_name: "TestTexterFirst",
      last_name: "TestTexterLast",
      cell: "555-555-6666",
      email: "testtexter@example.com"
    });
    const joinQuery = `
    mutation joinOrganization($organizationUuid: String!) {
      joinOrganization(organizationUuid: $organizationUuid) {
        id
      }
    }`;
    const variables = {
      organizationUuid:
        startedCampaign.testOrganization.data.createOrganization.uuid
    };
    console.log("RESULT", variables, startedCampaign.testOrganization);
    const result = await runGql(joinQuery, variables, testTexterUser);
    expect(result.data.joinOrganization.id).toBeTruthy();
  });
  // TODO:
  /*
  it("join by campaign uuid", async () => {
    expect(true).toEqual(true);
  });
  it("failure on unstarted campaign", async () => {
    expect(true).toEqual(true);
  });
  it("failure on invalue org uuid", async () => {
    expect(true).toEqual(true);
  });
  it("failure on invalid campaign uuid", async () => {
    expect(true).toEqual(true);
  });
  it("no double joins (if added, don't create user_organization record)", async () => {
    // TODO: 1. check db 2. do another invite, 3. confirm db only has a single user_org record
  });
  */
});
