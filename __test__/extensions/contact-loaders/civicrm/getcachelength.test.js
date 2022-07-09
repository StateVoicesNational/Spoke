import { when } from "jest-when";
import { getCacheLength } from "../../../../src/extensions/contact-loaders/civicrm/getcachelength";
import { CIVICRM_CACHE_SECONDS } from "../../../../src/extensions/contact-loaders/civicrm/const";
import { hasConfig, getConfig } from "../../../../src/server/api/lib/config";

jest.mock("../../../../src/server/api/lib/config");

describe("civicrm/getcachelength", () => {
  beforeEach(async () => {
    when(getConfig)
      .calledWith("CIVICRM_API_KEY")
      .mockReturnValue("api");
    when(getConfig)
      .calledWith("CIVICRM_SITE_KEY")
      .mockReturnValue("site");
    when(getConfig)
      .calledWith("CIVICRM_API_URL")
      .mockReturnValue(
        "http://dmaster.localhost:7979/sites/all/modules/civicrm/extern/rest.php"
      );
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe("getCacheLength()", () => {
    it("returns CIVICRM_CACHE_SECONDS when CIVICRM_CACHE_LENGTHS is missing", async () => {
      when(hasConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue(false);
      expect(getCacheLength("civicrm")).toEqual(CIVICRM_CACHE_SECONDS);
    });

    it("returns CIVICRM_CACHE_SECONDS when the variable is blank", async () => {
      when(hasConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue("");
      expect(getCacheLength("civicrm")).toEqual(CIVICRM_CACHE_SECONDS);
    });

    it("returns CIVICRM_CACHE_SECONDS when the contact loader is missing", async () => {
      when(hasConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue("civicrm-registerevent:0,civicrm-sendemail:1800");
      expect(getCacheLength("civicrm")).toEqual(CIVICRM_CACHE_SECONDS);
    });

    it("returns the actual value for the contact loader", async () => {
      when(hasConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue(
          "civicrm:7200,civicrm-registerevent:0,civicrm-sendemail:1800"
        );
      expect(getCacheLength("civicrm")).toEqual(7200);
    });

    it("returns the default if the value can't be parsed", async () => {
      when(hasConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_CACHE_LENGTHS")
        .mockReturnValue("civicrm:1C20"); // 7200 in hex.
      expect(getCacheLength("civicrm")).toEqual(CIVICRM_CACHE_SECONDS);
    });
  });
});
