import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";
import nock from "nock";

const ZapierAction = require("../../../src/extensions/action-handlers/zapier-action");
require("../../test_helpers");
const log = require("../../../src/lib").log;

afterEach(async () => {
  jest.restoreAllMocks();
});

describe("zapier-action", () => {
  let veryFakeOrganization;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    process.env = { ...OLD_ENV };
    jest.spyOn(log, "info");
    veryFakeOrganization = {
      id: 9001
    };
  });

  afterEach(async () => {
    process.env = OLD_ENV;
  });

  it("should pass validation", async () => {
    expect(() => validateActionHandler(ZapierAction)).not.toThrowError();
  });

  describe("#onTagUpdate", async () => {
    it("should bail if ZAPIER_WEBHOOK_URL is undefined", async () => {
      process.env.ZAPIER_WEBHOOK_URL = undefined;
      const ret = await ZapierAction.onTagUpdate(null, null, null, null, null);
      expect(log.info.mock.calls[0][0]).toEqual(
        "ZAPIER_WEBHOOK_URL is undefined. Exiting."
      );
    });
  });

  describe("#processAction", async () => {
    it("should bail if ZAPIER_ACTION_URL is undefined", async () => {
      process.env.ZAPIER_ACTION_URL = undefined;
      const ret = await ZapierAction.processAction({});
      expect(log.info.mock.calls[0][0]).toEqual(
        "ZAPIER_ACTION_URL is undefined. Exiting."
      );
    });
  });
});
