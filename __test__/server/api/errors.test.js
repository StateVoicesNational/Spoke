import { r } from "../../../src/server/models/";
import {
  authRequired,
  assignmentRequiredOrAdminRole
} from "../../../src/server/api/errors";

const errors = require("../../../src/server/api/errors.js");

import {
  setupTest,
  cleanupTest,
  createStartedCampaign
} from "../../test_helpers";

describe("errors.js", () => {
  let startedCampaign;

  beforeEach(async () => {
    // Set up an entire working campaign
    await setupTest();
    startedCampaign = await createStartedCampaign();
  });

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  describe("#authRequired", () => {
    it("does not throw an exception if a user is passed to it", async () => {
      authRequired(startedCampaign.testTexterUser);
    });

    it("throws an exception if nothing is passed to it", async () => {
      let error;
      try {
        authRequired(undefined);
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeDefined();
      expect(error.message).toEqual({
        message: "You must login to access that resource.",
        status: 401
      });
    });
  });

  describe("#accessRequiredOrAdminRole", () => {
    it("accessRequired fails with missing orgId", async () => {
      let errored = false;
      try {
        await accessRequired(
          startedCampaign.testTexterUser,
          "", // missing orgId
          "TEXTER"
        );
      } catch (err) {
        errored = err;
      }
      expect(errored).toBeTruthy();

      errored = false;
      try {
        await accessRequired(
          startedCampaign.testTexterUser,
          null, // missing orgId
          "TEXTER"
        );
      } catch (err) {
        errored = err;
      }
      expect(errored).toBeTruthy();

      errored = false;
      try {
        await accessRequired(
          startedCampaign.testTexterUser,
          null, // missing orgId
          "OWNER"
        );
      } catch (err) {
        errored = err;
      }
      expect(errored).toBeTruthy();
    });

    it("returns truthy when a texter user has the assignment", async () => {
      const assignment = await assignmentRequiredOrAdminRole(
        startedCampaign.testTexterUser,
        startedCampaign.organizationId,
        startedCampaign.assignmentId
      );
      expect(Boolean(assignment)).toBe(true);
      expect(assignment.campaign_id).toBe(1);
    });

    it("when a user is superadmin with no assignment returns true", async () => {
      expect(
        await assignmentRequiredOrAdminRole(
          startedCampaign.testSuperAdminUser,
          startedCampaign.organizationId
        )
      ).toBe(true);
    });

    it("returns true if the user has the assignment", async () => {
      expect(
        await assignmentRequiredOrAdminRole(
          startedCampaign.testTexterUser,
          startedCampaign.organizationId,
          startedCampaign.assignmentId,
          null,
          startedCampaign.assignment
        )
      ).toBe(true);
    });

    describe("when the user does not have the assignment", () => {
      it("throws an exception without assignment", async () => {
        let error;
        try {
          await assignmentRequiredOrAdminRole(
            startedCampaign.testTexterUser2,
            startedCampaign.organizationId,
            startedCampaign.assignmentId
          );
        } catch (caught) {
          error = caught;
        }

        expect(error).toBeDefined();
        expect(error.message).toEqual(
          "You are not authorized to access that resource."
        );
      });

      it("throws an exception", async () => {
        let error;
        try {
          await assignmentRequiredOrAdminRole(
            startedCampaign.testTexterUser2,
            startedCampaign.organizationId,
            startedCampaign.assignmentId,
            null,
            startedCampaign.assignment
          );
        } catch (caught) {
          error = caught;
        }

        expect(error).toBeDefined();
        expect(error.message).toEqual(
          "You are not authorized to access that resource."
        );
      });
    });

    it("when the user is an admin returns true", async () => {
      expect(
        await assignmentRequiredOrAdminRole(
          startedCampaign.testAdminUser,
          startedCampaign.organizationId,
          startedCampaign.assignmentId
        )
      ).toBe(true);
    });

    it("when the user is a superadmin returns true", async () => {
      expect(
        await assignmentRequiredOrAdminRole(
          startedCampaign.testSuperAdminUser,
          startedCampaign.organizationId,
          startedCampaign.assignmentId
        )
      ).toBe(true);
    });
  });
});
