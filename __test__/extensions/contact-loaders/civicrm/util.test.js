import { when } from "jest-when";
import {
  getIntegerArray,
  getCustomFields,
  getCacheLength,
  getCivi
} from "../../../../src/extensions/contact-loaders/civicrm/util";
import { CIVICRM_CACHE_SECONDS } from "../../../../src/extensions/contact-loaders/civicrm/const";
import { hasConfig, getConfig } from "../../../../src/server/api/lib/config";

jest.mock("../../../../src/server/api/lib/config");

describe("civicrm/util", () => {
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

  it("expects getIntegerArray to work as expected.", () => {
    expect(getIntegerArray(undefined)).toEqual([]);
    expect(getIntegerArray(null)).toEqual([]);
    expect(getIntegerArray("")).toEqual([]);
    expect(getIntegerArray("1")).toEqual([1]);
    expect(getIntegerArray("1,-2")).toEqual([1, -2]);
    expect(getIntegerArray("1,-2,3")).toEqual([1, -2, 3]);
    expect(getIntegerArray("a")).toEqual([]);
  });

  it("expects getCustomFields to work as expected.", () => {
    expect(getCustomFields(undefined)).toEqual({});
    expect(getCustomFields(null)).toEqual({});
    expect(getCustomFields("")).toEqual({});
    expect(getCustomFields("a")).toEqual({ a: "a" });
    expect(getCustomFields("a:b")).toEqual({ a: "b" });
    expect(getCustomFields("a,c")).toEqual({ a: "a", c: "c" });
    expect(getCustomFields("a:b,c:d")).toEqual({ a: "b", c: "d" });
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

  it("expects getCivi to work as expected.", () => {
    expect(getCivi()).toEqual({
      api_key: "api",
      debug: 1,
      key: "site",
      path: "/sites/all/modules/civicrm/extern/rest.php",
      server: "http://dmaster.localhost:7979"
    });
  });
});
