import {
  createUser,
  createTexter,
  createInvite,
  createOrganization,
  setupTest,
  cleanupTest
} from "../../../test_helpers";

import { r, cacheableData } from "../../../../src/server/models";

describe("cacheable_queries.user", () => {
  let queryLog;
  let testAdminUser;
  let testInvite;
  let testOrganization;
  let testTexterUser;
  let organizationId;
  function spokeDbListener(data) {
    if (
      queryLog &&
      (!queryLog.length ||
        queryLog[queryLog.length - 1].__knexQueryUid != data.__knexQueryUid)
    ) {
      queryLog.push(data);
    }
  }

  beforeEach(async () => {
    await setupTest();
    testAdminUser = await createUser({ auth0_id: "admin_auth_data" });
    testInvite = await createInvite();
    testOrganization = await createOrganization(testAdminUser, testInvite);
    testTexterUser = await createTexter(testOrganization, {
      auth0_id: "texter1_auth_data"
    });
    organizationId = testOrganization.data.createOrganization.id;

    if (r.redis) {
      await r.redis.flushdb();
    }
    queryLog = [];
    r.knex.on("query", spokeDbListener);
  });
  afterEach(async () => {
    await cleanupTest();
  });
  it("userHasRole texter has texter", async () => {
    const texterRole = await cacheableData.user.userHasRole(
      testTexterUser,
      organizationId,
      "TEXTER"
    );
    expect(texterRole).toBeTruthy();
  });
  it("userHasRole texter does not have texter for another org", async () => {
    const texterRoleNo = await cacheableData.user.userHasRole(
      testTexterUser,
      organizationId + 100,
      "TEXTER"
    );
    expect(texterRoleNo).not.toBeTruthy();
  });
  it("userHasRole texter does not have admin", async () => {
    const adminRoleNo = await cacheableData.user.userHasRole(
      testTexterUser,
      organizationId,
      "ADMIN"
    );
    expect(adminRoleNo).not.toBeTruthy();
  });
  it("userHasRole owner has admin", async () => {
    const adminRoleYes = await cacheableData.user.userHasRole(
      testAdminUser,
      organizationId,
      "ADMIN"
    );
    expect(adminRoleYes).toBeTruthy();
  });
  it("userOrgs", async () => {
    const a = await cacheableData.user.userOrgs(testAdminUser.id, "ADMIN");
    const b = await cacheableData.user.userOrgs(testAdminUser.id, "TEXTER");
    const c = await cacheableData.user.userOrgs(testTexterUser.id, "TEXTER");
    const d = await cacheableData.user.userOrgs(testTexterUser.id, "TEXTER");
    expect(a).toEqual([
      { id: 1, role: "OWNER", name: "Testy test organization" }
    ]);
    expect(b).toEqual([
      { id: 1, name: "Testy test organization", role: "OWNER" }
    ]);
    expect(c).toEqual([
      { id: 1, role: "TEXTER", name: "Testy test organization" }
    ]);
    expect(d).toEqual([
      { id: 1, name: "Testy test organization", role: "TEXTER" }
    ]);
  });
  it("orgRoles", async () => {
    const a = await cacheableData.user.orgRoles(
      testAdminUser.id,
      organizationId
    );
    const b = await cacheableData.user.orgRoles(
      testAdminUser.id,
      organizationId + 100
    );
    const c = await cacheableData.user.orgRoles(
      testTexterUser.id,
      organizationId
    );
    expect(a).toEqual([
      "SUSPENDED",
      "TEXTER",
      "VETTED_TEXTER",
      "SUPERVOLUNTEER",
      "ADMIN",
      "OWNER"
    ]);
    expect(b).toEqual([]);
    expect(c).toEqual(["SUSPENDED", "TEXTER"]);
  });
  it("addNotification is cleared with get", async () => {
    const start = await cacheableData.user.getAndClearNotifications(
      testAdminUser.id
    );
    expect(start).toEqual([]);
    await cacheableData.user.addNotification(testAdminUser.id, 2);
    const next = await cacheableData.user.getAndClearNotifications(
      testAdminUser.id
    );
    if (r.redis) {
      expect(next).toEqual(["2"]);
      const nextAfter = await cacheableData.user.getAndClearNotifications(
        testAdminUser.id
      );
      expect(nextAfter).toEqual([]);
      await cacheableData.user.addNotification(testAdminUser.id, 1);
      await cacheableData.user.addNotification(testAdminUser.id, 4);
      const savingTwo = await cacheableData.user.getAndClearNotifications(
        testAdminUser.id
      );
      expect(savingTwo).toEqual(["1", "4"]);
    } else {
      expect(next).toEqual([]);
    }
  });
});
