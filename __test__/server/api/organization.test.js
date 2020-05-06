/* eslint-disable no-unused-expressions, consistent-return */
import { r } from "../../../src/server/models/";
import { getCampaignsQuery } from "../../../src/containers/CampaignList";
import { GraphQLError } from "graphql/error";

import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  createTexter,
  runGql
} from "../../test_helpers";

describe("organization", async () => {
  let testTexterUser;
  let testAdminUser;
  let testInvite;
  let testOrganization;
  let testCampaign;
  let organizationId;

  beforeEach(async () => {
    // Set up an entire working campaign
    await setupTest();
    testAdminUser = await createUser();
    testInvite = await createInvite();
    testOrganization = await createOrganization(testAdminUser, testInvite);
    organizationId = testOrganization.data.createOrganization.id;
    testCampaign = await createCampaign(
      testAdminUser,
      testOrganization,
      "Apples",
      { dueBy: new Date(2019, 11, 31) }
    );
    testTexterUser = await createTexter(testOrganization);
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  describe("organization query", async () => {
    let testCampaign2;
    let testCampaign3;
    let testCampaign4;
    let variables;
    let cursor;

    beforeEach(async () => {
      testCampaign2 = await createCampaign(
        testAdminUser,
        testOrganization,
        "Oranges",
        { dueBy: new Date(2019, 11, 30) }
      );
      testCampaign3 = await createCampaign(
        testAdminUser,
        testOrganization,
        "Apples and Oranges",
        { dueBy: new Date(2019, 11, 29) }
      );
      testCampaign4 = await createCampaign(
        testAdminUser,
        testOrganization,
        "Banana",
        { dueBy: new Date(2019, 11, 28) }
      );

      cursor = {
        offset: 0,
        limit: 1000
      };

      variables = {
        cursor,
        organizationId
      };
    });

    it("filters by a single campaign id", async () => {
      const campaignsFilter = {
        campaignId: testCampaign.id
      };
      variables.campaignsFilter = campaignsFilter;

      const result = await runGql(getCampaignsQuery, variables, testAdminUser);
      expect(result.data.organization.campaigns.campaigns.length).toEqual(1);
      expect(result.data.organization.campaigns.campaigns[0].id).toEqual(
        testCampaign.id
      );
    });

    it("filter by more than one campaign id", async () => {
      const campaignsFilter = {
        campaignIds: [testCampaign.id, testCampaign2.id]
      };
      variables.campaignsFilter = campaignsFilter;

      const result = await runGql(getCampaignsQuery, variables, testAdminUser);
      expect(result.data.organization.campaigns.campaigns.length).toEqual(2);

      const returnedIds = result.data.organization.campaigns.campaigns.map(
        campaign => campaign.id
      );
      expect(returnedIds).toContain(testCampaign.id);
      expect(returnedIds).toContain(testCampaign2.id);
    });

    it("filters by search string", async () => {
      const campaignsFilter = {
        searchString: "oranges"
      };
      variables.campaignsFilter = campaignsFilter;

      const result = await runGql(getCampaignsQuery, variables, testAdminUser);
      expect(result.data.organization.campaigns.campaigns.length).toEqual(2);

      const returnedIds = result.data.organization.campaigns.campaigns.map(
        campaign => campaign.id
      );
      expect(returnedIds).toContain(testCampaign2.id);
      expect(returnedIds).toContain(testCampaign3.id);
    });

    it("regular texters don't have permission", async () => {
      const result = await runGql(getCampaignsQuery, variables, testTexterUser);
      expect(result.errors).toEqual([
        new GraphQLError("You are not authorized to access that resource.")
      ]);
    });

    describe("sorts", async () => {
      const runTest = async (sortBy, expectedOrderedIds) => {
        variables.sortBy = sortBy;
        const result = await runGql(
          getCampaignsQuery,
          variables,
          testAdminUser
        );
        expect(result.data.organization.campaigns.campaigns.length).toEqual(4);
        const returnedIds = result.data.organization.campaigns.campaigns.map(
          campaign => campaign.id
        );
        expect(returnedIds).toEqual(expectedOrderedIds);
      };

      it("sorts by due date ascending", async () => {
        await runTest("DUE_DATE_ASC", [
          testCampaign4.id,
          testCampaign3.id,
          testCampaign2.id,
          testCampaign.id
        ]);
      });
      it("sorts by due date descending", async () => {
        await runTest("DUE_DATE_DESC", [
          testCampaign.id,
          testCampaign2.id,
          testCampaign3.id,
          testCampaign4.id
        ]);
      });
      it("sorts by id ascending", async () => {
        await runTest("ID_ASC", [
          testCampaign.id,
          testCampaign2.id,
          testCampaign3.id,
          testCampaign4.id
        ]);
      });
      it("sorts by id desc", async () => {
        await runTest("ID_DESC", [
          testCampaign4.id,
          testCampaign3.id,
          testCampaign2.id,
          testCampaign.id
        ]);
      });
      it("sorts by title", async () => {
        await runTest("TITLE", [
          testCampaign.id,
          testCampaign3.id,
          testCampaign4.id,
          testCampaign2.id
        ]);
      });
    });
  });
});
