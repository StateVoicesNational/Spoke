import { setupTest, cleanupTest } from "../../test_helpers";

import { getUsers } from "../../../src/server/api/user";

import {
  User,
  Organization,
  UserOrganization
} from "../../../src/server/models/";

describe("User", () => {
  beforeAll(
    async () => await setupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );
  afterAll(
    async () => await cleanupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );

  let organization;
  beforeEach(async () => {
    organization = await new Organization({
      name: "organization",
      texting_hours_start: 0,
      texting_hours_end: 0
    }).save();
  });

  describe("getUsers", async () => {
    it("returns pageInfo.total == user.length when there's a cursor", async () => {
      const users = [
        await new User({
          auth0_id: "abc",
          first_name: "First1",
          last_name: "Last1",
          cell: "212-555-5555",
          email: "email1@example.com"
        }).save(),
        await new User({
          auth0_id: "def",
          first_name: "First2",
          last_name: "Last2",
          cell: "646-555-5555",
          email: "email2@example.com"
        }).save()
      ];

      await new UserOrganization({
        user_id: users[0].id,
        organization_id: organization.id,
        role: "OWNER"
      }).save();
      await new UserOrganization({
        user_id: users[1].id,
        organization_id: organization.id,
        role: "TEXTER"
      }).save();

      const getUsersResult = await getUsers(
        organization.id,
        {
          offset: 0,
          limit: 1000
        },
        null,
        null,
        null
      );

      expect(getUsersResult.users.length).toEqual(2);
      expect(getUsersResult.pageInfo.total).toEqual(2);
    });
  });
});
