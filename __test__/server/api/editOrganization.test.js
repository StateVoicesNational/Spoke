/* eslint-disable no-unused-expressions, consistent-return */
import { r } from "../../../src/server/models/";
import { getFeatures } from "../../../src/server/api/lib/config";
import { getCampaignsQuery } from "../../../src/containers/AdminCampaignList";
import { editOrganizationGql } from "../../../src/containers/Settings";
import { GraphQLError } from "graphql/error";

import {
  cleanupTest,
  createStartedCampaign,
  runGql,
  setupTest
} from "../../test_helpers";

describe("editOrganization", async () => {
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

  describe("features", () => {
    it("save and get", async () => {
      const result = await runGql(
        editOrganizationGql,
        {
          organizationId: startedCampaign.organizationId,
          organizationChanges: {
            texterUIConfig: {
              options: `{"foo": "bar"}`
            }
          }
        },
        startedCampaign.testAdminUser
      );
      const [org] = await r
        .knex("organization")
        .where("id", startedCampaign.organizationId);
      const features = getFeatures(org);
      expect(typeof features.TEXTER_UI_SETTINGS).toBe("string");
      expect(JSON.parse(features.TEXTER_UI_SETTINGS)).toEqual({ foo: "bar" });
    });
    // TODO:
    // 1. get from cache
    // 2. get from API
    // 3. set features to something, and confirm existing ones are not overwritten
  });
});
