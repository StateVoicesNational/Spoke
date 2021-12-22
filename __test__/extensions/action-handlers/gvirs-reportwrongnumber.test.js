import { when } from "jest-when";
import { validateActionHandler } from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/gvirs-reportwrongnumber";
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
    expect(HandlerToTest.name).toEqual("gvirs-reportwrongnumber");
    expect(HandlerToTest.displayName()).toEqual(
      "gVIRS: Report a wrong number for a voter"
    );
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
  });

  describe("gvirs-reportwrongnumber available()", () => {
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
});
