import { r } from "../../../src/server/models";
import each from "jest-each";
import {
  setupTest,
  cleanupTest,
  createStartedCampaign
} from "../../test_helpers";
const ActionHandlers = require("../../../src/integrations/action-handlers");
const uuidv4 = require("uuid").v4;
const TestAction = require("../../../src/integrations/action-handlers/test-action");
const ComplexTestAction = require("../../../src/integrations/action-handlers/complex-test-action");
const log = require("../../../src/lib").log;

describe("action-handlers/index", () => {
  let organization;
  let user;
  let savedEnvironment;

  beforeAll(async () => {
    savedEnvironment = { ...process.env };

    await setupTest();

    const startedCampaign = await createStartedCampaign();
    ({
      testOrganization: {
        data: { createOrganization: organization }
      },
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

      describe("when cacheKey is null or undefined or not a string", () => {
        beforeEach(async () => {
          fallbackFunction = jest.fn().mockResolvedValue({
            data: "hey now"
          });
        });

        each([[null], [undefined], [0], [{}]]).test(
          "it calls the fallback function twice when cacheKey is %s",
          async testCacheKey => {
            if (!r.redis) {
              return;
            }

            let returned = await ActionHandlers.getSetCacheableResult(
              testCacheKey,
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
          }
        );
      });
    });
  });

  describe("validateActionHandler", () => {
    each([[TestAction], [ComplexTestAction]]).test(
      "Doesn't throw when it validates %j",
      handler => {
        expect(() =>
          ActionHandlers.validateActionHandler(handler)
        ).not.toThrow();
      }
    );

    each([
      [[{ name: "name", shouldValidate: true, type: "string" }]],
      [[{ name: "displayName", shouldValidate: true, type: "function" }]],
      [[{ name: "available", shouldValidate: true, type: "function" }]],
      [[{ name: "processAction", shouldValidate: true, type: "function" }]],
      [[{ name: "instructions", shouldValidate: true, type: "function" }]],
      [
        [
          {
            name: "serverAdministratorInstructions",
            shouldValidate: true,
            type: "function"
          }
        ]
      ],
      [
        [{ name: "instructions", shouldValidate: true, type: "function" }],
        [{ name: "processAction", shouldValidate: true, type: "function" }]
      ],
      [
        [
          {
            name: "getClientChoiceData",
            shouldValidate: false,
            type: "function"
          }
        ]
      ],
      [
        [
          {
            name: "clientChoiceDataCacheKey",
            shouldValidate: false,
            type: "function"
          }
        ]
      ]
    ]).test("validate that action handler implements %j", items => {
      const fakeHandlerToValidate = {
        name: "fake-handler",
        displayName: () => {},
        available: () => {},
        processAction: () => {},
        instructions: () => {},
        serverAdministratorInstructions: () => {}
      };
      items.forEach(item => {
        delete fakeHandlerToValidate[item.name];
      });

      let error;
      try {
        ActionHandlers.validateActionHandler(fakeHandlerToValidate);
      } catch (caughtError) {
        error = caughtError;
      } finally {
        let expectedError;
        if (items.some(item => item.shouldValidate)) {
          expectedError = new Error(
            `Missing required exports ${JSON.stringify(
              items.map(item => item.name)
            )}`
          );
        }
        expect(error).toEqual(expectedError);
      }
    });
  });

  describe("#getActionHandlerAvailability", () => {
    describe("happy path", () => {
      beforeEach(async () => {
        jest.spyOn(TestAction, "available").mockResolvedValue({
          result: "fake_result"
        });
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

    describe("when available throws an exception", () => {
      beforeEach(async () => {
        jest
          .spyOn(TestAction, "available")
          .mockRejectedValue(new Error("What could possibly go wrong?"));
      });

      it("returns false", async () => {
        const returned = await ActionHandlers.getActionHandlerAvailability(
          "test-action",
          TestAction,
          organization,
          user
        );

        expect(returned).toEqual(false);
        expect(TestAction.available.mock.calls).toEqual([[organization, user]]);
      });
    });

    describe("when validateActionHandler throws an exception", () => {
      beforeEach(async () => {
        jest
          .spyOn(ActionHandlers, "validateActionHandler")
          .mockImplementation(() => {
            throw new Error("fake complaint");
          });

        jest.spyOn(log, "error");
      });

      it("returns false", async () => {
        const returned = await ActionHandlers.getActionHandlerAvailability(
          "test-action",
          TestAction,
          organization,
          user
        );
        expect(returned).toEqual(false);
        expect(log.error.mock.calls).toEqual([
          [
            "FAILED TO POLL AVAILABILITY from action handler test-action. Error: fake complaint"
          ]
        ]);
      });
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

  describe("#getActionChoiceData", () => {
    let expectedReturn;

    beforeEach(async () => {
      expectedReturn = [
        {
          details: '{"hex":"#B22222","rgb":{"r":178,"g":34,"b":34}}',
          name: "firebrick"
        },
        {
          details: '{"hex":"#4B0082","rgb":{"r":75,"g":0,"b":130}}',
          name: "indigo"
        }
      ];

      jest.spyOn(ComplexTestAction, "getClientChoiceData");
      jest.spyOn(ComplexTestAction, "clientChoiceDataCacheKey");
    });

    it("returns actionChoiceData", async () => {
      const returned = await ActionHandlers.getActionChoiceData(
        ComplexTestAction,
        organization,
        user
      );

      expect(returned).toEqual(expectedReturn);

      expect(ComplexTestAction.clientChoiceDataCacheKey.mock.calls).toEqual([
        [organization, user]
      ]);

      expect(ComplexTestAction.getClientChoiceData.mock.calls).toEqual([
        [organization, user]
      ]);

      // handles the second call from the cache
      const secondCallReturned = await ActionHandlers.getActionChoiceData(
        ComplexTestAction,
        organization,
        user
      );

      expect(secondCallReturned).toEqual(expectedReturn);

      expect(ComplexTestAction.clientChoiceDataCacheKey.mock.calls).toEqual([
        [organization, user],
        [organization, user]
      ]);

      expect(ComplexTestAction.getClientChoiceData.mock.calls).toEqual([
        [organization, user],
        ...(!r.redis && [[organization, user]])
      ]);
    });

    describe("when the handler doesn't export getClientChoiceData", () => {
      it("returns an empty array", async () => {
        const returned = await ActionHandlers.getActionChoiceData(
          TestAction,
          organization,
          user
        );
        expect(returned).toEqual([]);
      });
    });

    describe("edge cases", () => {
      let fakeAction;
      beforeEach(async () => {
        fakeAction = {
          name: "fake-action"
        };
      });
      describe("when the handler doesn't export clientChoiceDataCacheKey", () => {
        beforeEach(async () => {
          fakeAction.getClientChoiceData =
            ComplexTestAction.getClientChoiceData;
          jest.spyOn(ActionHandlers, "getSetCacheableResult");
        });
        it("returns the expected choice data but creates a default cache key", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            { id: 99 },
            user
          );
          expect(returned).toEqual(expectedReturn);
          expect(ActionHandlers.getSetCacheableResult.mock.calls).toEqual([
            [
              `${process.env.CACHE_PREFIX || ""}action-choices-fake-action-99`,
              expect.any(Function)
            ]
          ]);
        });
      });

      describe("when the handler returned null or undefined from getClientChoiceData", () => {
        beforeEach(async () => {
          fakeAction.getClientChoiceData = () => undefined;
        });
        it("returns an empty array", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            organization,
            user
          );
          expect(returned).toEqual([]);
        });
      });

      describe("when the handler returns clientChoiceData without a data property", () => {
        beforeEach(async () => {
          fakeAction.getClientChoiceData = () => ({
            expiresSeconds: 77
          });
        });
        it("returns an empty array", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            organization,
            user
          );
          expect(returned).toEqual([]);
        });
      });

      describe("when the data property is bad JSON", () => {
        beforeEach(async () => {
          fakeAction.getClientChoiceData = () => ({
            data: "bad sneakers and a piña colada my friend",
            expiresSeconds: 77
          });
        });
        it("returns an empty array", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            organization,
            user
          );
          expect(returned).toEqual([]);
        });
      });

      describe("when the data property doesn't have an items key", () => {
        beforeEach(async () => {
          fakeAction.getClientChoiceData = () => ({
            data: "{}",
            expiresSeconds: 77
          });
        });
        it("returns an empty array", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            organization,
            user
          );
          expect(returned).toEqual([]);
        });
      });

      describe("when the items property is not an array", () => {
        beforeEach(async () => {
          fakeAction.getClientChoiceData = () => ({
            data: JSON.stringify({ items: {} }),
            expiresSeconds: 77
          });
          jest.spyOn(log, "error");
        });
        it("returns an empty array", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            organization,
            user
          );
          expect(returned).toEqual([]);
          expect(log.error.mock.calls).toEqual([
            [
              "Data received from fake-action.getClientChoiceData is not an array"
            ]
          ]);
        });
      });

      describe("when getClientChoiceDataCacheKey throws an exception", () => {
        beforeEach(async () => {
          fakeAction.clientChoiceDataCacheKey = () => {
            throw new Error("broken action handler");
          };
          fakeAction.getClientChoiceData =
            ComplexTestAction.getClientChoiceData;
          jest.spyOn(log, "error");
          jest.spyOn(ActionHandlers, "getSetCacheableResult");
        });
        it("returns an empty array", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            organization,
            user
          );
          expect(returned).toEqual(expectedReturn);
          expect(log.error.mock.calls).toEqual([
            [
              "EXCEPTION GENERATING CACHE KEY for action handler fake-action Error: broken action handler"
            ]
          ]);
          expect(ActionHandlers.getSetCacheableResult.mock.calls).toEqual([
            [undefined, expect.any(Function)]
          ]);
        });
      });

      describe("when getClientChoiceData throws an exception", () => {
        beforeEach(async () => {
          fakeAction.clientChoiceDataCacheKey =
            ComplexTestAction.clientChoiceDataCacheKey;
          fakeAction.getClientChoiceData = () => {
            throw new Error("complaint");
          };
          jest.spyOn(log, "error");
          jest.spyOn(ActionHandlers, "getSetCacheableResult");
        });
        it("returns an empty array", async () => {
          const returned = await ActionHandlers.getActionChoiceData(
            fakeAction,
            organization,
            user
          );
          expect(returned).toEqual([]);
          expect(log.error.mock.calls).toEqual([
            [
              "EXCEPTION GETTING CLIENT CHOICE DATA for action handler fake-action Error: complaint"
            ]
          ]);
          expect(ActionHandlers.getSetCacheableResult.mock.calls).toEqual([
            [
              `${process.env.CACHE_PREFIX || ""}action-choices-fake-action-1`,
              expect.any(Function)
            ]
          ]);
        });
      });
    });
  });
});
