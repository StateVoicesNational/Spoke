import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";
import { searchEvents } from "../../../src/extensions/contact-loaders/civicrm/util";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-registerevent";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";
import { CIVICRM_CACHE_SECONDS } from "../../../src/extensions/contact-loaders/civicrm/const";

jest.mock("../../../src/server/api/lib/config");
jest.mock("../../../src/extensions/contact-loaders/civicrm/util");

describe("civicrm-registerevent", () => {
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
    expect(HandlerToTest.name).toEqual("civicrm-registerevent");
    expect(HandlerToTest.displayName()).toEqual(
      "Register contact for CiviCRM event"
    );
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
    expect(HandlerToTest.clientChoiceDataCacheKey({ id: 1 })).toEqual("1");
  });

  describe("civicrm-registerevent available()", () => {
    it("is available if the civicrm contact loader is available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });
  });

  describe("civicrm-registerevent getClientChoiceData()", () => {
    it("returns successful data when data is available", async () => {
      const theEventData = [
        {
          id: "2",
          title: "Company",
          event_title: "Demo Event",
          default_role_id: "1"
        }
      ];

      when(searchEvents).mockResolvedValue(theEventData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data:
          '{"items":[{"name":"Company","details":"{\\"id\\":\\"2\\",\\"role_id\\":\\"1\\"}"}]}',
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });

    it("returns successful data when data is empty", async () => {
      const theEventData = [];

      when(searchEvents).mockResolvedValue(theEventData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data: '{"items":[]}',
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });
  });
});
