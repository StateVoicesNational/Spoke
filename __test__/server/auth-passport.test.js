import passport from "passport";
import passportSetup from "../../src/server/auth-passport";
import request from "supertest";
import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization
} from "../test_helpers";
import jwt from "jsonwebtoken";

jest.mock("babel-polyfill", () => ({}));

beforeEach(async () => {
  await setupTest();

  jest.resetModules();
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

  describe("token auth strategy", () => {
    const {
      NODE_ENV: OLD_ENV,
      PASSPORT_STRATEGY: OLD_PASSPORT_STRATEGY
    } = process.env;

    const JWT_SETTINGS = {
      PASSPORT_STRATEGY: "token",
      TOKEN_AUTH_ISSUER: "test",
      TOKEN_AUTH_AUDIENCE: "test",
      TOKEN_AUTH_SHARED_SECRET: "SECRET",
      TOKEN_AUTH_URL: "http://example.test/login-echo"
    };

    const JWT_TEMPLATE = {
      sub: "foo@example.test",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      iss: JWT_SETTINGS.TOKEN_AUTH_ISSUER,
      aud: JWT_SETTINGS.TOKEN_AUTH_AUDIENCE
    };

    const signedToken = jwt.sign(
      { ...JWT_TEMPLATE },
      JWT_SETTINGS.TOKEN_AUTH_SHARED_SECRET
    );

    const invalidToken = jwt.sign({ ...JWT_TEMPLATE }, "bad secret");

    let orgId;

    beforeEach(async () => {
      const invite = await createInvite();
      const user = await createUser({ email: "foo@example.test" });
      const org = await createOrganization(user, invite);

      orgId = org.data.createOrganization.id;
    });

    describe("Token Auth Passport tests", () => {
      beforeEach(async () => {
        process.env = {
          ...process.env,
          NODE_ENV: "development",
          ...JWT_SETTINGS
        };
      }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

      afterEach(async () => {
        const {
          NODE_ENV,
          TOKEN_AUTH_ISSUER,
          TOKEN_AUTH_AUDIENCE,
          TOKEN_AUTH_SHARED_SECRET,
          TOKEN_AUTH_URL,
          ...newEnv
        } = process.env;
        process.env = {
          NODE_ENV: OLD_ENV,
          PASSPORT_STRATEGY: OLD_PASSPORT_STRATEGY,
          ...newEnv
        };
      }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

      it("will authenticate a user based on shared secret", async () => {
        const { default: app } = require("../../src/server");

        // Sanity test
        await request(app)
          .get(`/admin/${orgId}/campaigns`)
          .expect(302);

        // Login callback will send user to the appropriate page with the right token
        await request(app)
          .get(`/login-callback?nextUrl=/admin/${orgId}/campaigns`)
          .set("Authorization", `Bearer ${signedToken}`)
          .expect(302)
          .expect("Location", `/admin/${orgId}/campaigns`);

        // Bad tokens get rejected
        await request(app)
          .get(`/login-callback`)
          .set("Authorization", `Bearer ${invalidToken}`)
          .expect(401);
      });
    });
  });
});
