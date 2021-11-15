import { when } from "jest-when";
import {
  decomposeGVIRSConnections,
  getGVIRSCustomFields
} from "../../../../src/extensions/contact-loaders/gvirs/util";
import { getConfig } from "../../../../src/server/api/lib/config";

jest.mock("../../../../src/server/api/lib/config");

describe("civicrm/util", () => {
  beforeEach(async () => {
    when(getConfig)
      .calledWith("GVIRS_CONNECTIONS")
      .mockReturnValue("default,https://localdev1.gvirs.com,xapikey1,xappid1");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("expects getGVIRSCustomFields to work as expected.", () => {
    expect(getGVIRSCustomFields(undefined)).toEqual({});
    expect(getGVIRSCustomFields(null)).toEqual({});
    expect(getGVIRSCustomFields("")).toEqual({});
    expect(getGVIRSCustomFields("a")).toEqual({ a: "a" });
    expect(getGVIRSCustomFields("a:b")).toEqual({ a: "b" });
    expect(getGVIRSCustomFields("a,c")).toEqual({ a: "a", c: "c" });
    expect(getGVIRSCustomFields("a:b,c:d")).toEqual({ a: "b", c: "d" });
  });

  it("expects decomposeGVIRSConnections to work as expected.", () => {
    expect(decomposeGVIRSConnections(undefined)).toEqual({});
    expect(decomposeGVIRSConnections(null)).toEqual({});
    expect(decomposeGVIRSConnections("")).toEqual({});
    expect(decomposeGVIRSConnections("default")).toEqual({});
    expect(
      decomposeGVIRSConnections("default1,https://localdev1.gvirs.com")
    ).toEqual({});
    expect(
      decomposeGVIRSConnections("default1,https://localdev1.gvirs.com,xapikey1")
    ).toEqual({});
    expect(
      decomposeGVIRSConnections(
        "default1,https://localdev1.gvirs.com,xapikey1,xappid1"
      )
    ).toEqual({
      default1: {
        domain: "https://localdev1.gvirs.com",
        xapikey: "xapikey1",
        xappid: "xappid1"
      }
    });
    expect(
      decomposeGVIRSConnections(
        "default1,https://localdev1.gvirs.com,xapikey1,xappid1;default2"
      )
    ).toEqual({});
    expect(
      decomposeGVIRSConnections(
        "default1,https://localdev1.gvirs.com,xapikey1,xappid1;default2,https://localdev2.gvirs.com"
      )
    ).toEqual({});
    expect(
      decomposeGVIRSConnections(
        "default1,https://localdev1.gvirs.com,xapikey1,xappid1;default2,https://localdev2.gvirs.com;xapikey2"
      )
    ).toEqual({});
    expect(
      decomposeGVIRSConnections(
        "default1,https://localdev1.gvirs.com,xapikey1,xappid1;default2,https://localdev2.gvirs.com,xapikey2,xappid2"
      )
    ).toEqual({
      default1: {
        domain: "https://localdev1.gvirs.com",
        xapikey: "xapikey1",
        xappid: "xappid1"
      },
      default2: {
        domain: "https://localdev2.gvirs.com",
        xapikey: "xapikey2",
        xappid: "xappid2"
      }
    });
  });
});
