import { when } from "jest-when";
import * as LoaderToTest from "../../../../src/extensions/contact-loaders/civicrm";
import { hasConfig } from "../../../../src/server/api/lib/config";
import {
  CIVICRM_CACHE_SECONDS,
  CIVICRM_CONTACT_LOADER
} from "../../../../src/extensions/contact-loaders/civicrm/const";
import { getCacheLength } from "../../../../src/extensions/contact-loaders/civicrm/getcachelength";
jest.mock("../../../../src/server/api/lib/config");
jest.mock("../../../../src/extensions/contact-loaders/civicrm/getcachelength");

describe("civicrm contact loader", () => {
  beforeEach(async () => {});

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("comes with standard contact loader functionality", async () => {
    // Most action handlers in Spoke have test handlers which are as simple as calling
    // the validateActionHandler function. The validateActionHandler function is basically
    // "Does the handler have this function?" A lot of these tests are doing the same thing.

    when(hasConfig)
      .calledWith("CONTACT_LOADERS")
      .mockReturnValue("civicrm");
    when(getCacheLength)
      .calledWith(CIVICRM_CONTACT_LOADER)
      .mockReturnValue(1800);

    expect(LoaderToTest.name).toEqual("civicrm");
    expect(LoaderToTest.displayName()).toEqual("CiviCRM");
    expect(LoaderToTest.clientChoiceDataCacheKey({ id: 1 }, null)).toEqual("1");
    expect(
      await LoaderToTest.getClientChoiceData({ id: 1 }, null, null)
    ).toEqual({
      data: "{}",
      expiresSeconds: 1800
    });
    expect(typeof LoaderToTest.addServerEndpoints).toEqual("function");
    expect(typeof LoaderToTest.available).toEqual("function");
    expect(typeof LoaderToTest.processContactLoad).toEqual("function");
  });

  describe("civicrm contact loader available()", () => {
    afterEach(async () => {
      jest.clearAllMocks();
    });

    it("is available if all mandatory environment variables are available", async () => {
      when(hasConfig)
        .calledWith("CIVICRM_API_KEY")
        .mockReturnValue(true);
      when(hasConfig)
        .calledWith("CIVICRM_SITE_KEY")
        .mockReturnValue(true);
      when(hasConfig)
        .calledWith("CIVICRM_API_URL")
        .mockReturnValue(true);
      when(getCacheLength)
        .calledWith(CIVICRM_CONTACT_LOADER)
        .mockReturnValue(CIVICRM_CACHE_SECONDS * 5);

      expect(await LoaderToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: CIVICRM_CACHE_SECONDS * 5
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(hasConfig)
        .calledWith("CIVICRM_API_KEY")
        .mockReturnValue(false);
      when(hasConfig)
        .calledWith("CIVICRM_SITE_KEY")
        .mockReturnValue(false);
      when(hasConfig)
        .calledWith("CIVICRM_API_URL")
        .mockReturnValue(false);
      when(getCacheLength)
        .calledWith(CIVICRM_CONTACT_LOADER)
        .mockReturnValue(CIVICRM_CACHE_SECONDS);

      expect(await LoaderToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });
  });
});
