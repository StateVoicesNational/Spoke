import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";
import {
  searchEvents,
  getCacheLength
} from "../../../src/extensions/contact-loaders/civicrm/util";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-registerevent";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";
import {
  CIVICRM_ACTION_HANDLER_REGISTEREVENT,
  CIVICRM_CONTACT_LOADER
} from "../../../src/extensions/contact-loaders/civicrm/const";

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
    when(getCacheLength)
      .calledWith(CIVICRM_CONTACT_LOADER)
      .mockReturnValue(7200);
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
    expect(HandlerToTest.name).toEqual(CIVICRM_ACTION_HANDLER_REGISTEREVENT);
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
      when(getCacheLength)
        .calledWith(CIVICRM_ACTION_HANDLER_REGISTEREVENT)
        .mockReturnValue(1800);
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: 1800
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      when(getCacheLength)
        .calledWith(CIVICRM_ACTION_HANDLER_REGISTEREVENT)
        .mockReturnValue(1800);
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: 1800
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
          default_role_id: "1",
          start_date: "2021-11-01 16:00:00"
        }
      ];

      when(searchEvents).mockResolvedValue(theEventData);
      when(getCacheLength)
        .calledWith(CIVICRM_ACTION_HANDLER_REGISTEREVENT)
        .mockReturnValue(7200);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data:
          '{"items":[{"name":"Company (2021-11-01)","details":"{\\"id\\":\\"2\\",\\"role_id\\":\\"1\\"}"}]}',
        expiresSeconds: 7200
      });
    });

    it("returns successful data when data is empty", async () => {
      const theEventData = [];

      when(searchEvents).mockResolvedValue(theEventData);
      when(getCacheLength)
        .calledWith(CIVICRM_ACTION_HANDLER_REGISTEREVENT)
        .mockReturnValue(7200);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data: '{"items":[]}',
        expiresSeconds: 7200
      });
    });
  });
});
