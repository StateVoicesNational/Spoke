import { resolvers } from "../src/server/api/schema";
import { schema } from "../src/api/schema";
import twilio from "../src/server/api/lib/twilio";
import { getConfig, hasConfig } from "../src/server/api/lib/config";
import { makeExecutableSchema } from "graphql-tools";

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
  allowUndefinedInResolve: true
});

it("should parse a message with a media url", () => {
  expect(twilio.parseMessageText({ text: "foo bar" }).body).toBe("foo bar");
  expect(
    twilio.parseMessageText({ text: "foo bar [http://example.com/foo.jpg]" })
      .body
  ).toBe("foo bar ");
  expect(
    twilio.parseMessageText({ text: "foo bar [http://example.com/foo.jpg]" })
      .mediaUrl
  ).toBe("http://example.com/foo.jpg");
  expect(
    twilio.parseMessageText({ text: "foo bar [ https://example.com/foo.jpg ]" })
      .mediaUrl
  ).toBe("https://example.com/foo.jpg");

  const doubleShouldOnlyUseFirst =
    "foo bar [ https://example.com/foo.jpg ] and this other image! [ https://example.com/bar.jpg ]";
  expect(
    twilio.parseMessageText({ text: doubleShouldOnlyUseFirst }).mediaUrl
  ).toBe("https://example.com/foo.jpg");
  expect(twilio.parseMessageText({ text: doubleShouldOnlyUseFirst }).body).toBe(
    "foo bar  and this other image! [ https://example.com/bar.jpg ]"
  );

  expect(twilio.parseMessageText({ text: undefined }).body).toBe("");
});

describe("getConfig/hasConfig", () => {
  // note this is only testing global.* for set vars
  // but implicitly it's testing CONFIG_FILE.json for unset vars, at least
  it("should return getConfig for set var", () => {
    expect(getConfig("TEST_ENVIRONMENT")).toBe("1");
  });

  it("should return getConfig for unset var", () => {
    expect(getConfig("XXXTEST_ENVIRONMENT")).toBe(undefined);
  });

  it("should return false for hasConfig for unset var", () => {
    expect(hasConfig("XXXTEST_ENVIRONMENT")).toBe(false);
  });

  it("should return false for hasConfig for blank set var", () => {
    expect(hasConfig("TWILIO_ACCOUNT_SID")).toBe(false);
  });

  it("should return true for hasConfig for set var", () => {
    expect(hasConfig("TEST_ENVIRONMENT")).toBe(true);
  });

  it("should return true for truthy getConfig for set var 1", () => {
    expect(getConfig("TEST_ENVIRONMENT", null, { truthy: true })).toBe(true);
  });

  it("should return true for truthy getConfig for set var non-empty str", () => {
    expect(getConfig("DEFAULT_SERVICE", null, { truthy: true })).toBe(true);
  });

  it("should return false for truthy getConfig for set var 0", () => {
    expect(getConfig("TEST_ENVIRONMENT_FAKE", null, { truthy: true })).toBe(
      false
    );
  });

  it("should return false for truthy getConfig for set var false", () => {
    expect(getConfig("TEST_ENVIRONMENT_FAKE2", null, { truthy: true })).toBe(
      false
    );
  });

  it("should return false for truthy getConfig for unset var false", () => {
    expect(getConfig("XXXTEST_ENVIRONMENT", null, { truthy: true })).toBe(
      false
    );
  });
});
