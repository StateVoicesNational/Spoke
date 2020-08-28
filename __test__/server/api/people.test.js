/* eslint-disable no-unused-expressions, consistent-return */
import { r } from "../../../src/server/models/";
import { getUsersGql } from "../../../src/containers/PeopleList";
import { GraphQLError } from "graphql/error";

import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  createTexter,
  createContacts,
  assignTexter,
  updateUserRoles,
  runGql
} from "../../test_helpers";

describe("people", async () => {
  let testTexterUsers;
  let testAdminUsers;
  let testContacts;
  let testCampaigns;
  let testInvite;
  let testOrganization;
  let organizationId;
  let variables;
  let cursor;

  beforeEach(async () => {
    await setupTest();

    testAdminUsers = [];
    testAdminUsers.push(
      await createUser({
        first_name: "Bill",
        last_name: "Graham",
        cell: "555-555-6666",
        email: "bill@bgp.com"
      })
    );

    testAdminUsers.push(
      await createUser({
        first_name: "Sam",
        last_name: "Cutler",
        cell: "555-555-7777",
        email: "sam@dead.net"
      })
    );

    testInvite = await createInvite();
    testOrganization = await createOrganization(testAdminUsers[0], testInvite);
    organizationId = testOrganization.data.createOrganization.id;

    await updateUserRoles(
      testAdminUsers[0],
      organizationId,
      testAdminUsers[0].id,
      ["OWNER"]
    );

    await updateUserRoles(
      testAdminUsers[0],
      organizationId,
      testAdminUsers[1].id,
      ["ADMIN"]
    );

    // campaigns
    testCampaigns = [];
    testCampaigns.push(
      await createCampaign(testAdminUsers[0], testOrganization, "Apples", {
        dueBy: new Date(2019, 11, 31)
      })
    );

    testCampaigns.push(
      await createCampaign(testAdminUsers[0], testOrganization, "Oranges", {
        dueBy: new Date(2019, 11, 30)
      })
    );

    testCampaigns.push(
      await createCampaign(
        testAdminUsers[0],
        testOrganization,
        "Apples and Oranges",
        { dueBy: new Date(2019, 11, 29) }
      )
    );

    testCampaigns.push(
      await createCampaign(testAdminUsers[0], testOrganization, "Banana", {
        dueBy: new Date(2019, 11, 28)
      })
    );

    // texters
    testTexterUsers = [];
    testTexterUsers.push(
      await createTexter(testOrganization, {
        first_name: "Jerry",
        last_name: "Garcia",
        cell: "555-555-1111",
        email: "jerry@dead.net"
      })
    );

    testTexterUsers.push(
      await createTexter(testOrganization, {
        first_name: "Bob",
        last_name: "Weir",
        cell: "555-555-2222",
        email: "bob@dead.net"
      })
    );

    testTexterUsers.push(
      await createTexter(testOrganization, {
        first_name: "Phil",
        last_name: "Lesh",
        cell: "555-555-3333",
        email: "phil@gmail.com"
      })
    );

    testTexterUsers.push(
      await createTexter(testOrganization, {
        first_name: "Mickey",
        last_name: "Hart",
        cell: "555-555-4444",
        email: "mickey@dead.net"
      })
    );

    testTexterUsers.push(
      await createTexter(testOrganization, {
        first_name: "William",
        last_name: "Kreutzman",
        cell: "555-555-5555",
        email: "bill@dead.net"
      })
    );

    // contacts
    testContacts = [];
    testContacts.push(await createContacts(testCampaigns[0], 10));
    testContacts.push(await createContacts(testCampaigns[1], 10));
    testContacts.push(await createContacts(testCampaigns[2], 10));
    testContacts.push(await createContacts(testCampaigns[3], 10));

    // assign contacts
    await assignTexter(testAdminUsers[0], null, testCampaigns[0], [
      { id: testTexterUsers[0].id, needsMessageCount: 3 },
      { id: testTexterUsers[1].id, needsMessageCount: 3 }
    ]);

    await assignTexter(testAdminUsers[0], null, testCampaigns[1], [
      { id: testTexterUsers[2].id, needsMessageCount: 3 },
      { id: testTexterUsers[3].id, needsMessageCount: 3 }
    ]);

    await assignTexter(testAdminUsers[0], null, testCampaigns[2], [
      { id: testTexterUsers[0].id, needsMessageCount: 3 },
      { id: testTexterUsers[4].id, needsMessageCount: 3 }
    ]);

    await assignTexter(testAdminUsers[0], null, testCampaigns[3], [
      { id: testTexterUsers[1].id, needsMessageCount: 3 },
      { id: testTexterUsers[3].id, needsMessageCount: 3 }
    ]);

    // other stuff
    cursor = {
      offset: 0,
      limit: 1000
    };

    variables = {
      cursor,
      organizationId
    };
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  describe("filtering", async () => {
    const testFiltering = async (result, expectedUsers) => {
      expect(result.data.people.users.length).toEqual(expectedUsers.length);

      const receivedIds = result.data.people.users.map(user =>
        parseInt(user.id, 10)
      );
      expect(receivedIds).toEqual(
        expect.arrayContaining(expectedUsers.map(user => user.id))
      );
    };

    it("filters users to those assigned to a single campaign", async () => {
      const campaignsFilter = {
        campaignId: testCampaigns[0].id
      };
      variables.campaignsFilter = campaignsFilter;
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testFiltering(result, [testTexterUsers[0], testTexterUsers[1]]);
    });

    it("filters users to those assigned to multiple campaigns", async () => {
      const campaignsFilter = {
        campaignIds: [testCampaigns[0].id, testCampaigns[3].id]
      };
      variables.campaignsFilter = campaignsFilter;
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testFiltering(result, [
        testTexterUsers[0],
        testTexterUsers[1],
        testTexterUsers[3]
      ]);
    });

    const testRoleFiltering = async (role, expectedUsers) => {
      variables.role = role;
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testFiltering(result, expectedUsers);
    };

    it("filters users by role, selecting admins", async () => {
      await testRoleFiltering("ADMIN", [testAdminUsers[1]]);
    });

    it("filters users by role, selecting texters", async () => {
      await testRoleFiltering("TEXTER", testTexterUsers);
    });

    it("selects all users when role filter is not provided", async () => {
      await testRoleFiltering("", [...testTexterUsers, ...testAdminUsers]);
    });

    const testFilterStringFiltering = async (
      filterBy,
      filterString,
      expectedUsers
    ) => {
      variables.filterBy = filterBy;
      variables.filterString = filterString;
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testFiltering(result, expectedUsers);
    };

    it("filters by first name", async () => {
      await testFilterStringFiltering("FIRST_NAME", "jerry", [
        testTexterUsers[0]
      ]);
    });

    it("filters by first name with partial match", async () => {
      await testFilterStringFiltering("FIRST_NAME", "il", [
        testTexterUsers[2],
        testTexterUsers[4],
        testAdminUsers[0]
      ]);
    });

    it("filters by first name case insensitive", async () => {
      await testFilterStringFiltering("FIRST_NAME", "JERRY", [
        testTexterUsers[0]
      ]);
    });

    it("filters by last name", async () => {
      await testFilterStringFiltering("LAST_NAME", "garcia", [
        testTexterUsers[0]
      ]);
    });

    it("filters by last name case insensitive", async () => {
      await testFilterStringFiltering("LAST_NAME", "GARCIA", [
        testTexterUsers[0]
      ]);
    });

    it("filters by last name with partial match", async () => {
      await testFilterStringFiltering("LAST_NAME", "ha", [
        testTexterUsers[3],
        testAdminUsers[0]
      ]);
    });

    it("filters by email", async () => {
      await testFilterStringFiltering("EMAIL", "jerry@dead.net", [
        testTexterUsers[0]
      ]);
    });

    it("filters by email with partial match", async () => {
      await testFilterStringFiltering("EMAIL", "dead", [
        testTexterUsers[0],
        testTexterUsers[1],
        testTexterUsers[3],
        testTexterUsers[4],
        testAdminUsers[1]
      ]);
    });

    it("filters by any", async () => {
      await testFilterStringFiltering("ANY", "bill", [
        testTexterUsers[4],
        testAdminUsers[0]
      ]);
    });

    it("behaves correctly when there is no filter string", async () => {
      await testFilterStringFiltering("ANY", "", [
        ...testTexterUsers,
        ...testAdminUsers
      ]);
    });

    it("behaves correctly when filterBy is not an exact match", async () => {
      variables.filterBy = "any";
      variables.filterString = "dead.net";
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);

      expect(result.data).toBeUndefined();
      expect(result.errors).toEqual([
        new GraphQLError(
          'Variable "$filterBy" got invalid value "any"; Expected type FilterPeopleBy; did you mean ANY?'
        )
      ]);
    });

    it("returns no users if none match the filter", async () => {
      await testFilterStringFiltering("ANY", "xxx", []);
    });

    it("filters by campaign and search string", async () => {
      variables.filterBy = "EMAIL";
      variables.filterString = "jerry";
      variables.campaignId = testCampaigns[0].id;
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testFiltering(result, [testTexterUsers[0]]);
    });

    it("filters by campaign, search string and role", async () => {
      variables.filterBy = "EMAIL";
      variables.filterString = "jerry";
      variables.campaignId = testCampaigns[0].id;
      variables.role = "TEXTER";
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testFiltering(result, [testTexterUsers[0]]);
    });
  });

  describe("sorting", async () => {
    const testSortResults = async (result, expectedUsers) => {
      expect(result.data.people.users.length).toEqual(expectedUsers.length);

      const receivedIds = result.data.people.users.map(user =>
        parseInt(user.id, 10)
      );

      expect(receivedIds).toEqual(expectedUsers.map(user => user.id));
    };

    const testSorting = async (sortBy, expectedUsers) => {
      variables.sortBy = sortBy;
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testSortResults(result, expectedUsers);
    };

    const sortExpected = (sortBy, desc = false) => (a, b) => {
      const aLower =
        typeof a[sortBy] === "string" ? a[sortBy].toLowerCase() : a[sortBy];
      const bLower =
        typeof b[sortBy] === "string" ? b[sortBy].toLowerCase() : b[sortBy];
      if (aLower === bLower) return 0;
      if (aLower < bLower) return desc ? 1 : -1;
      return desc ? -1 : 1;
    };

    it("sorts by first name", async () => {
      await testSorting(
        "FIRST_NAME",
        [...testAdminUsers, ...testTexterUsers].sort(sortExpected("first_name"))
      );
    });

    it("sorts by last name", async () => {
      await testSorting(
        "LAST_NAME",
        [...testAdminUsers, ...testTexterUsers].sort(sortExpected("last_name"))
      );
    });

    it("sorts newest first", async () => {
      await testSorting(
        "NEWEST",
        [...testAdminUsers, ...testTexterUsers].sort(sortExpected("id", true))
      );
    });

    it("sorts oldest first", async () => {
      await testSorting(
        "OLDEST",
        [...testAdminUsers, ...testTexterUsers].sort(sortExpected("id"))
      );
    });

    it("filters texters and sorts newest first", async () => {
      variables.sortBy = "NEWEST";
      variables.role = "TEXTER";
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);
      await testSortResults(
        result,
        testTexterUsers.sort(sortExpected("id", true))
      );
    });
  });

  describe("pagination", async () => {
    beforeEach(async () => {
      cursor = {
        offset: 0,
        limit: 2
      };

      variables = {
        cursor,
        organizationId,
        sortBy: "OLDEST",
        role: "TEXTER"
      };
    });

    const testPagination = async offset => {
      cursor.offset = offset;
      const result = await runGql(getUsersGql, variables, testAdminUsers[0]);

      const receivedIds = result.data.people.users.map(user =>
        parseInt(user.id, 10)
      );

      expect(receivedIds).toEqual(
        testTexterUsers.slice(offset, offset + 2).map(user => user.id)
      );
      expect(receivedIds.length).toEqual(
        testTexterUsers.slice(offset, offset + 2).length
      );
      expect(result.data.people.pageInfo).toEqual({
        limit: 2,
        offset,
        total: 5
      });
    };

    it("returns the first 2", async () => {
      await testPagination(0);
    });

    it("returns 2 from the middle", async () => {
      await testPagination(2);
    });

    it("returns the last one", async () => {
      await testPagination(4);
    });
  });

  describe("permissions", async () => {
    it("doesn't allow texter users to retrieve people", async () => {
      const result = await runGql(getUsersGql, variables, testTexterUsers[0]);
      expect(result.errors).toEqual([
        new GraphQLError("You are not authorized to access that resource.")
      ]);
    });
  });
});
