import { r, createLoaders } from "../../../src/server/models";
import {
  setupTest,
  cleanupTest,
  createStartedCampaign
} from "../../test_helpers";
import * as ActionHandlers from "../../../src/integrations/action-handlers";
const uuidv4 = require("uuid").v4;
const TestAction = require("../../../src/integrations/action-handlers/test-action");
const ComplexTestAction = require("../../../src/integrations/action-handlers/complex-test-action");

describe("action-handlers/index", () => {
  let organization;
  let user;
  let campaign;
  let savedEnvironment;

  beforeAll(async () => {
    savedEnvironment = { ...process.env };

    await setupTest();

    const startedCampaign = await createStartedCampaign();
    ({
      testOrganization: {
        data: { createOrganization: organization }
      },
      testCampaign: campaign,
      testAdminUser: user
    } = startedCampaign);
  });

  afterAll(async () => {
    await cleanupTest();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  beforeEach(async () => {
    jest.restoreAllMocks();
    if (r.redis) {
      r.redis.flushdb();
    }
  });

  afterEach(async () => {
    const toReset = ["CACHE_PREFIX", "ACTION_HANDLERS"];

    toReset.forEach(thingToReset => {
      if (!savedEnvironment[thingToReset]) {
        delete process.env[thingToReset];
      } else {
        process.env[thingToReset] = savedEnvironment[thingToReset];
      }
    });
  });

  describe("#availabilityCacheKey", () => {
    it("returns what we expect", async () => {
      const cacheKey = ActionHandlers.availabilityCacheKey(
        "grateful-dead",
        organization,
        2
      );
      expect(cacheKey).toEqual(
        `${process.env.CACHE_PREFIX || ""}action-avail-grateful-dead-1-2`
      );
    });

    describe("when CACHE_PREFIX is set in the environment", () => {
      beforeEach(async () => {
        process.env.CACHE_PREFIX = process.env.CACHE_PREFIX || "my-org";
      });

      it("returns what we expect", async () => {
        const cacheKey = ActionHandlers.availabilityCacheKey(
          "grateful-dead",
          organization,
          2
        );
        expect(cacheKey).toEqual(
          `${process.env.CACHE_PREFIX}action-avail-grateful-dead-1-2`
        );
      });
    });
  });

  describe("#choiceDataCacheKey", () => {
    it("returns what we expect", async () => {
      const cacheKey = ActionHandlers.choiceDataCacheKey(
        "grateful-dead",
        organization,
        "1978.04.17"
      );
      expect(cacheKey).toEqual(
        `${process.env.CACHE_PREFIX ||
          ""}action-choices-grateful-dead-1978.04.17`
      );
    });

    describe("when CACHE_PREFIX is set in the environment", () => {
      beforeEach(async () => {
        process.env.CACHE_PREFIX = process.env.CACHE_PREFIX || "my-org";
      });

      it("returns what we expect", async () => {
        const cacheKey = ActionHandlers.choiceDataCacheKey(
          "grateful-dead",
          organization,
          "1978.04.17"
        );
        expect(cacheKey).toEqual(
          `${process.env.CACHE_PREFIX ||
            ""}action-choices-grateful-dead-1978.04.17`
        );
      });
    });
  });

  describe("#getActionHandlers", () => {
    it("loads test-action and complex-test-action", async () => {
      const handlers = ActionHandlers.getActionHandlers(organization);
      expect(handlers).toEqual({
        "test-action": TestAction,
        "complex-test-action": ComplexTestAction
      });
    });

    describe("when ACTION_HANDLERS are specified in the environment", () => {
      it("returns the specified handler", async () => {
        process.env.ACTION_HANDLERS = "test-action";
        const handlers = ActionHandlers.getActionHandlers(organization);
        expect(handlers).toEqual({ "test-action": TestAction });
      });

      describe("when there is more than one action handler", () => {
        it("returns both of them", async () => {
          process.env.ACTION_HANDLERS = "test-action,complex-test-action";
          const handlers = ActionHandlers.getActionHandlers(organization);
          expect(handlers).toEqual({
            "test-action": TestAction,
            "complex-test-action": ComplexTestAction
          });
        });

        describe("and one doesn't exist in the directory", () => {
          it("returns the one that exists", async () => {
            process.env.ACTION_HANDLERS = "test-action,missing-test-action";
            const handlers = ActionHandlers.getActionHandlers(organization);
            expect(handlers).toEqual({ "test-action": TestAction });
          });
        });

        describe("and none exist in the directory", () => {
          it("returns the one that exists", async () => {
            process.env.ACTION_HANDLERS = "missing-test-action";
            const handlers = ActionHandlers.getActionHandlers(organization);
            expect(handlers).toEqual({});
          });
        });
      });
    });
  });

  describe("#getSetCacheableResult", () => {
    let fallbackFunction;
    let cacheKey;
    beforeEach(async () => {
      cacheKey = uuidv4();
      fallbackFunction = jest.fn().mockResolvedValue({
        data: "hey now",
        expiresSeconds: 1000
      });
    });

    describe("redis is not configured", () => {
      it("calls the fallback function", async () => {
        const returned = await ActionHandlers.getSetCacheableResult(
          cacheKey,
          fallbackFunction
        );

        expect(returned).toEqual({
          data: "hey now",
          expiresSeconds: 1000
        });
        expect(fallbackFunction.mock.calls).toEqual([[]]);
      });
    });

    describe("redis is configured", () => {
      beforeAll(async () => {
        cacheKey = uuidv4();
      });
      it("calls the fallback function once", async () => {
        // don't run this test if redis is not configured
        if (!r.redis) {
          return;
        }

        let returned = await ActionHandlers.getSetCacheableResult(
          cacheKey,
          fallbackFunction
        );
        expect(returned).toEqual({
          data: "hey now",
          expiresSeconds: 1000
        });
        expect(fallbackFunction.mock.calls).toEqual([[]]);

        returned = await ActionHandlers.getSetCacheableResult(
          cacheKey,
          fallbackFunction
        );
        expect(returned).toEqual({
          data: "hey now",
          expiresSeconds: 1000
        });
        expect(fallbackFunction.mock.calls).toEqual([[]]);
      });

      describe("when the fallback function doesn't return expiresSeconds", () => {
        beforeEach(async () => {
          fallbackFunction = jest.fn().mockResolvedValue({
            data: "hey now"
          });
        });
        it("calls the fallback function twice", async () => {
          // don't run this test if redis is not configured
          if (!r.redis) {
            return;
          }

          let returned = await ActionHandlers.getSetCacheableResult(
            cacheKey,
            fallbackFunction
          );
          expect(returned).toEqual({
            data: "hey now"
          });
          expect(fallbackFunction.mock.calls).toEqual([[]]);

          returned = await ActionHandlers.getSetCacheableResult(
            cacheKey,
            fallbackFunction
          );
          expect(returned).toEqual({
            data: "hey now"
          });
          expect(fallbackFunction.mock.calls).toEqual([[], []]);
        });
      });
    });
  });

  describe("#getActionHandlerAvailability", () => {
    beforeEach(async () => {
      jest
        .spyOn(TestAction, "available")
        .mockResolvedValue({ result: "fake_result" });
    });
    it("calls actionHandler.available", async () => {
      const returned = await ActionHandlers.getActionHandlerAvailability(
        "test-action",
        TestAction,
        organization,
        user
      );

      expect(returned).toEqual("fake_result");
      expect(TestAction.available.mock.calls).toEqual([[organization, user]]);
    });
  });

  describe("#rawActionHandler", () => {
    it("returns the handler", async () => {
      expect(ActionHandlers.rawActionHandler("test-action")).toEqual(
        TestAction
      );
    });

    describe("when the handler doesn't exist", () => {
      it("doesn't return the handler", async () => {
        expect(ActionHandlers.rawActionHandler("not-a-thing")).toEqual(
          undefined
        );
      });
    });
  });

  describe("#rawAllActionHandlers", () => {
    it("returns the handler", async () => {
      expect(ActionHandlers.rawAllActionHandlers()).toEqual({
        "test-action": TestAction,
        "complex-test-action": ComplexTestAction
      });
    });
  });

  describe("#getActionHandler", () => {
    it("returns the handler", async () => {
      const returned = await ActionHandlers.getActionHandler(
        "test-action",
        organization,
        user
      );

      expect(returned).toEqual(TestAction);
    });

    describe("when the handler doesn't exist", () => {
      it("returns nothing", async () => {
        const returned = await ActionHandlers.getActionHandler(
          "not-a-handler",
          organization,
          user
        );

        expect(returned).toBe(false);
      });

      describe("when the handler is unavailable", () => {
        beforeEach(async () => {
          jest
            .spyOn(ComplexTestAction, "available")
            .mockResolvedValue({ result: false });
        });

        it("doesn't return it", async () => {
          const returned = await ActionHandlers.getActionHandler(
            "complex-test-action",
            organization,
            user
          );

          expect(returned).toBe(false);
        });
      });
    });
  });

  describe("#getAvailableActionHandlers", () => {
    it("returns all the handlers", async () => {
      const returned = await ActionHandlers.getAvailableActionHandlers(
        organization,
        user
      );

      expect(returned).toHaveLength(2);
      expect(returned).toEqual(
        expect.arrayContaining([TestAction, ComplexTestAction])
      );
    });

    describe("when one of the action handlers is unavailable", () => {
      beforeEach(async () => {
        jest
          .spyOn(ComplexTestAction, "available")
          .mockResolvedValue({ result: false });
      });

      it("returns the action handler that is available", async () => {
        const returned = await ActionHandlers.getAvailableActionHandlers(
          organization,
          user
        );

        expect(returned).toHaveLength(1);
        expect(returned).toEqual(expect.arrayContaining([TestAction]));
      });
    });
  });

  describe.only("#getActionChoiceData", () => {
    let loaders;
    let expectedReturn;

    beforeEach(async () => {
      loaders = createLoaders();

      expectedReturn = {
        items: [
          {
            details: '{"hex":"#B22222","rgb":{"r":178,"g":34,"b":34}}',
            name: "firebrick"
          },
          {
            details: '{"hex":"#4B0082","rgb":{"r":75,"g":0,"b":130}}',
            name: "indigo"
          }
        ]
      };

      jest.spyOn(ComplexTestAction, "getClientChoiceData");
      jest.spyOn(ComplexTestAction, "clientChoiceDataCacheKey");
    });

    it("returns actionChoiceData", async () => {
      const returned = await ActionHandlers.getActionChoiceData(
        ComplexTestAction,
        organization,
        campaign,
        user,
        loaders
      );

      const parsed = JSON.parse(returned);

      expect(parsed).toEqual(expectedReturn);

      expect(ComplexTestAction.clientChoiceDataCacheKey.mock.calls).toEqual([
        [organization, campaign, user, loaders]
      ]);

      expect(ComplexTestAction.getClientChoiceData.mock.calls).toEqual([
        [organization, campaign, user, loaders]
      ]);

      // handles the second call from the cache
      const secondCallReturned = await ActionHandlers.getActionChoiceData(
        ComplexTestAction,
        organization,
        campaign,
        user,
        loaders
      );

      const secondCallParsed = JSON.parse(secondCallReturned);

      expect(secondCallParsed).toEqual(expectedReturn);

      expect(ComplexTestAction.clientChoiceDataCacheKey.mock.calls).toEqual([
        [organization, campaign, user, loaders],
        [organization, campaign, user, loaders]
      ]);

      expect(ComplexTestAction.getClientChoiceData.mock.calls).toEqual([
        [organization, campaign, user, loaders],
        ...(!r.redis && [[organization, campaign, user, loaders]])
      ]);
    });

    describe("when the handler doesn't have action choice data", () => {
      it("returns an empty object", async () => {
        const returned = await ActionHandlers.getActionChoiceData(
          TestAction,
          organization,
          campaign,
          user,
          loaders
        );
        expect(returned).toEqual("{}");
      });
    });
  });
});
