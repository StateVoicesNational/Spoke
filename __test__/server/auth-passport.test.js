import passport from "passport";
import passportSetup from "../../src/server/auth-passport";

import {
  setupTest,
  cleanupTest,
  createUser,
  createOrganization
} from "../test_helpers";

beforeEach(async () => {
  await setupTest();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

afterEach(async () => {
  await cleanupTest();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

describe("Local Auth Passport tests", () => {
  it("should deserialize false on non-existent user", async () => {
    const localAuth = passportSetup.local();
    passport.initialize();
    const session = passport.session();
    const deserialize = passport._deserializers[0];

    let results = [];
    await deserialize(1, function(err, val) {
      results.push(err, val);
    });
    expect(results[0]).toBe(null);
    expect(results[1]).toBe(false);
  });
  it("should deserialize user on existing user", async () => {
    const localAuth = passportSetup.local();
    passport.initialize();
    const session = passport.session();
    const deserialize = passport._deserializers[0];

    const testAdminUser = await createUser();

    let results = [];
    await deserialize(testAdminUser.id, function(err, val) {
      results.push(err, val);
    });
    expect(results[0]).toBe(null);
    expect(results[1].id).toBe(testAdminUser.id);
  });
  it("should return falsey on invalid id", async () => {
    const localAuth = passportSetup.local();
    passport.initialize();
    const session = passport.session();
    const deserialize = passport._deserializers[0];

    let results = [];
    await deserialize("JUNKjklsdf", function(err, val) {
      results.push(err, val);
    });
    expect(results[0]).toBe(null);
    expect(results[1]).toBeFalsy();
  });
});
