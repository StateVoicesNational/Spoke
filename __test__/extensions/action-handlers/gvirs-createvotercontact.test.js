import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/gvirs-createvotercontact";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";
import { GVIRS_CACHE_SECONDS } from "../../../src/extensions/contact-loaders/gvirs/const";

jest.mock("../../../src/server/api/lib/config");

describe("gvirs-createvotercontact", () => {
  beforeEach(async () => {
    when(hasConfig)
      .calledWith("GVIRS_CONNECTIONS")
      .mockReturnValue(true);
    when(getConfig)
      .calledWith("GVIRS_CONNECTIONS")
      .mockReturnValue("defaultorg,url,a,b");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("passes validation, and comes with standard action handler functionality", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
    expect(HandlerToTest.name).toEqual("gvirs-createvotercontact");
    expect(HandlerToTest.displayName()).toEqual(
      "Creates a contact (or interaction) with a voter"
    );
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
    expect(
      HandlerToTest.clientChoiceDataCacheKey({ name: "defaultorg", id: 1 })
    ).toEqual("1");
  });

  describe("gvirs-createvotercontact available()", () => {
    it("is available if the civicrm contact loader is available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("gvirs");
      expect(
        await HandlerToTest.available({ name: "defaultorg", id: 1 })
      ).toEqual({
        result: true,
        expiresSeconds: GVIRS_CACHE_SECONDS
      });
    });

    it("is not available if the civicrm contact loader is available but the organisation is not", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("gvirs");
      expect(
        await HandlerToTest.available({ name: "otherorg", id: 1 })
      ).toEqual({
        result: false,
        expiresSeconds: GVIRS_CACHE_SECONDS
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      expect(
        await HandlerToTest.available({ name: "defaultorg", id: 1 })
      ).toEqual({
        result: false,
        expiresSeconds: GVIRS_CACHE_SECONDS
      });
    });
  });

  describe("gvirs-createvotercontact getClientChoiceData()", () => {
    it("returns successful data when data is available", async () => {
      expect(
        await HandlerToTest.getClientChoiceData({ name: "defaultorg", id: 1 })
      ).toEqual({
        data:
          '{"items":[{"name":"Support level 1 (Strong support)","details":"{\\"index\\":0,\\"support_level\\":1,\\"contact_status_id\\":1,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Support level 2 (Weak support)","details":"{\\"index\\":1,\\"support_level\\":2,\\"contact_status_id\\":1,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Support level 3 (Undecided)","details":"{\\"index\\":2,\\"support_level\\":3,\\"contact_status_id\\":1,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Support level 4 (Weak oppose)","details":"{\\"index\\":3,\\"support_level\\":4,\\"contact_status_id\\":1,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Support level 5 (Strong oppose)","details":"{\\"index\\":4,\\"support_level\\":5,\\"contact_status_id\\":1,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Non-Meaningful Interaction","details":"{\\"index\\":5,\\"support_level\\":0,\\"contact_status_id\\":0,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Busy","details":"{\\"index\\":6,\\"support_level\\":0,\\"contact_status_id\\":2,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Language Barrier","details":"{\\"index\\":7,\\"support_level\\":0,\\"contact_status_id\\":3,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"No Answer","details":"{\\"index\\":8,\\"support_level\\":0,\\"contact_status_id\\":4,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Bad Info","details":"{\\"index\\":9,\\"support_level\\":0,\\"contact_status_id\\":5,\\"notes\\":\\"[From Spoke]\\"}"},{"name":"Refused","details":"{\\"index\\":10,\\"support_level\\":0,\\"contact_status_id\\":7,\\"notes\\":\\"[From Spoke]\\"}"}]}',
        expiresSeconds: GVIRS_CACHE_SECONDS
      });
    });
  });
});
