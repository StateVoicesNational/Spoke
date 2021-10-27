import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-addtogroup";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";

jest.mock("../../../src/server/api/lib/config");

describe("test-action-civicrm-addtogroup", () => {
  beforeEach(async () => {
    when(hasConfig)
      .calledWith("CIVICRM_API_KEY")
      .mockReturnValue(true);
    when(hasConfig)
      .calledWith("CIVICRM_SITE_KEY")
      .mockReturnValue(true);
    when(hasConfig)
      .calledWith("CIVICRM_API_URL")
      .mockReturnValue(true);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("passes validation, and comes with standard action handler functionality", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
    expect(HandlerToTest.name).toEqual("civicrm-addtogroup");
    expect(HandlerToTest.displayName()).toEqual("Add to CiviCRM group");
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
    expect(HandlerToTest.clientChoiceDataCacheKey({ id: 1 })).toEqual("1");
  });

  describe("test-action-civicrm-addtogroup available()", () => {
    it("is available if the civicrm contact loader is available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: 0
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: 0
      });
    });
  });
});
