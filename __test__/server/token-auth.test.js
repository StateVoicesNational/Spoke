import request from "supertest";
import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization
} from "../test_helpers";
import jwt from "jsonwebtoken";

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

beforeAll(async () => {
  await setupTest().then(async () => {
    const invite = await createInvite();
    const user = await createUser({ email: "foo@example.test" });
    const org = await createOrganization(user, invite);

    orgId = org.data.createOrganization.id;
  });
});

afterAll(() => {
  cleanupTest();
});

describe("Token Auth Passport tests", () => {
  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...process.env, NODE_ENV: "development", ...JWT_SETTINGS };
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
