import { r } from "../../../src/server/models/";
import {
  authRequired,
  assignmentRequired,
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

  describe("#accessRequired", () => {
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
  });

  describe("#assignmentRequired", () => {
    it("returns truthy when a texter user has the assignment", async () => {
      const assignment = await assignmentRequired(
        startedCampaign.testTexterUser,
        startedCampaign.assignmentId
      );
      expect(Boolean(assignment)).toBe(true);
      expect(assignment.campaign_id).toBe(1);
    });

    describe("when the user does not have the assignment", () => {
      it("throws an exception", async () => {
        let error;
        try {
          await assignmentRequired(
            startedCampaign.testTexterUser2,
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
    });

    describe("when a user is superadmin", () => {
      it("returns true", async () => {
        expect(
          await assignmentRequired(
            startedCampaign.testSuperAdminUser,
            startedCampaign.assignmentId
          )
        ).toBe(true);
      });
    });

    describe("when an assignment is passed", () => {
      it("returns true if the user has the assignment", async () => {
        expect(
          await assignmentRequired(
            startedCampaign.testTexterUser,
            startedCampaign.assignmentId,
            startedCampaign.assignment
          )
        ).toBe(true);
      });

      describe("when the user does not have the assignment", () => {
        it("throws an exception", async () => {
          let error;
          try {
            await assignmentRequired(
              startedCampaign.testTexterUser2,
              startedCampaign.assignmentId,
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
    });
  });

  describe("#assignmentRequiredOrAdminRole", () => {
    let spy;

    beforeEach(async () => {
      spy = jest.spyOn(errors, "assignmentRequired").mockResolvedValue(true);
    });

    afterEach(async () => {
      jest.restoreAllMocks();
    });

    it("calls assignmentRequired", async () => {
      await assignmentRequiredOrAdminRole(
        startedCampaign.testTexterUser,
        startedCampaign.organizationId,
        startedCampaign.assignmentId
      );
      expect(spy).toHaveBeenCalledWith(
        startedCampaign.testTexterUser,
        startedCampaign.assignmentId,
        null,
        undefined
      );
    });

    describe("when the user is an admin", () => {
      it("returns true", async () => {
        expect(
          await assignmentRequiredOrAdminRole(
            startedCampaign.testAdminUser,
            startedCampaign.organizationId,
            startedCampaign.assignmentId
          )
        ).toBe(true);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe("when the user is a superadmin", () => {
      it("returns true", async () => {
        expect(
          await assignmentRequiredOrAdminRole(
            startedCampaign.testSuperAdminUser,
            startedCampaign.organizationId,
            startedCampaign.assignmentId
          )
        ).toBe(true);
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });
});
