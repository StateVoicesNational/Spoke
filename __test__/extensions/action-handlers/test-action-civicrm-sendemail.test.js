import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-sendemail";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";

jest.mock("../../../src/server/api/lib/config");

describe("test-action-civicrm-sendemail", () => {
  it("passes validation, and comes with standard action handler functionality", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
    expect(HandlerToTest.name).toEqual("civicrm-sendemail");
    expect(HandlerToTest.displayName()).toEqual("Send email to contact");
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
    expect(HandlerToTest.clientChoiceDataCacheKey({ id: 1 })).toEqual("1");
  });

  describe("test-action-civicrm-sendemail available()", () => {
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

    it("is available if the civicrm contact loader is available and has CIVICRM_MESSAGE_IDS in env", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      when(hasConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue("1");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: 0
      });
    });

    it("is not available if the civicrm contact loader is available but does not have CIVICRM_MESSAGE_IDS in env", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      when(hasConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue(false);
      when(getConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue("1");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: 0
      });
    });

    it("is not available if the civicrm contact loader is available but has non-numeric CIVICRM_MESSAGE_IDS in env", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      when(hasConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue("false");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
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
