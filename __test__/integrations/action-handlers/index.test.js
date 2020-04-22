import { r } from "../../../src/server/models";
import * as ActionHandlers from "../../../src/integrations/action-handlers";
const uuidv4 = require("uuid").v4;
const TestAction = require("../../../src/integrations/action-handlers/test-action");

describe("actionn-handlers/index", () => {
  let organization;
  beforeEach(async () => {
    organization = {
      id: 1
    };
  });

  beforeEach(async () => {
    if (r.redis) r.redis.flushdb();
  });

  describe("#availabilityCacheKey", () => {
    it("returns what we expect", async () => {
      const cacheKey = ActionHandlers.availabilityCacheKey(
        "grateful-dead",
        organization,
        2
      );
      expect(cacheKey).toEqual("action-avail-grateful-dead-1-2");
    });

    describe("when CACHE_PREFIX is set in the environment", () => {
      beforeEach(async () => {
        process.env.CACHE_PREFIX = "my-org";
      });

      afterEach(async () => {
        delete process.env.CACHE_PREFIX;
      });

      it("returns what we expect", async () => {
        const cacheKey = ActionHandlers.availabilityCacheKey(
          "grateful-dead",
          organization,
          2
        );
        expect(cacheKey).toEqual("my-orgaction-avail-grateful-dead-1-2");
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
      expect(cacheKey).toEqual("action-choices-grateful-dead-1978.04.17");
    });

    describe("when CACHE_PREFIX is set in the environment", () => {
      beforeEach(async () => {
        process.env.CACHE_PREFIX = "my-org";
      });

      afterEach(async () => {
        delete process.env.CACHE_PREFIX;
      });

      it("returns what we expect", async () => {
        const cacheKey = ActionHandlers.choiceDataCacheKey(
          "grateful-dead",
          organization,
          "1978.04.17"
        );
        expect(cacheKey).toEqual(
          "my-orgaction-choices-grateful-dead-1978.04.17"
        );
      });
    });
  });

  describe("#getActionHandlers", () => {
    const makeExpectation = name => ({
      [name]: expect.objectContaining({
        available: expect.any(Function),
        displayName: expect.any(Function),
        instructions: expect.any(Function),
        name,
        processAction: expect.any(Function)
      })
    });

    it("loads test-action", async () => {
      const handlers = ActionHandlers.getActionHandlers(organization);
      expect(handlers).toEqual(makeExpectation("test-action"));
    });

    describe("when ACTION_HANDLERS are specified in the environment", () => {
      afterEach(async () => {
        delete process.env.ACTION_HANDLERS;
      });

      it("returns the specified handler", async () => {
        process.env.ACTION_HANDLERS = "test-action";
        const handlers = ActionHandlers.getActionHandlers(organization);
        expect(handlers).toEqual(makeExpectation("test-action"));
      });

      describe("when there is more than one action handler", () => {
        it("returns both of them", async () => {
          process.env.ACTION_HANDLERS = "test-action,complex-test-action";
          const handlers = ActionHandlers.getActionHandlers(organization);
          expect(handlers).toEqual({
            ...makeExpectation("test-action"),
            ...makeExpectation("complex-test-action")
          });
        });

        describe("and one doesn't exist in the directory", () => {
          it("returns the one that exists", async () => {
            process.env.ACTION_HANDLERS = "test-action,missing-test-action";
            const handlers = ActionHandlers.getActionHandlers(organization);
            expect(handlers).toEqual(makeExpectation("test-action"));
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
      jest.restoreAllMocks();
      fallbackFunction = jest.fn().mockResolvedValue({
        data: "hey now",
        expiresSeconds: 1000
      });
    });

    describe("redis is not configured", () => {
      let originalRedis;
      beforeEach(async () => {
        //let originalRedis = r.redis;
        //delete r.redis;
      });

      afterEach(async () => {
        //r.redis = originalRedis;
      });

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
        let returned = await ActionHandlers.getSetCacheableResult(
          cacheKey,
          fallbackFunction
        );
        expect(fallbackFunction.mock.calls).toEqual([[]]);
        expect(returned).toEqual({
          data: "hey now",
          expiresSeconds: 1000
        });
        expect(fallbackFunction.mock.calls).toEqual([[]]);

        returned = await ActionHandlers.getSetCacheableResult(
          cacheKey,
          fallbackFunction
        );
        expect(fallbackFunction.mock.calls).toEqual([[]]);
        expect(returned).toEqual({
          data: "hey now",
          expiresSeconds: 1000
        });
        expect(fallbackFunction.mock.calls).toEqual([[]]);
      });
    });
  });

  describe("getSetCacheableResults", () => {});

  describe("getActionHandlerAvailability", () => {});

  describe("rawActionHandler>", () => {});

  describe("rawAllMethods", () => {});

  describe("getActionHandler", () => {});

  describe("getAvailableActionHandlers", () => {});

  describe("getActionChoiceData", () => {});
});
