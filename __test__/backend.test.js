import { graphql } from "graphql";
import { isSqlite } from "../src/server/models/";
import { resolvers } from "../src/server/api/schema";
import { schema as apiSchema } from "../src/api/schema";

console.log("This is an intentional error");

import {
  User,
  Organization,
  Campaign,
  CampaignContact,
  Assignment,
  r,
  CannedResponse,
  InteractionStep,
  UserOrganization
} from "../src/server/models/";
import { resolvers as campaignResolvers } from "../src/server/api/campaign";
import {
  setupTest,
  cleanupTest,
  getContext,
  createUser as helperCreateUser,
  createTexter as helperCreateTexter,
  createOrganization as helperCreateOrganization,
  createInvite as helperCreateInvite,
  runGql
} from "./test_helpers";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { editUserMutation } from "../src/containers/UserEdit.jsx";

const schema = makeExecutableSchema({
  typeDefs: apiSchema,
  resolvers,
  allowUndefinedInResolve: true
});

const rootValue = {};

// data items used across tests

let testAdminUser;
let testInvite;
let testOrganization;
let testCampaign;
let testTexterUser;

// data creation functions

async function createUser(
  userInfo = {
    auth0_id: "test123",
    first_name: "TestUserFirst",
    last_name: "TestUserLast",
    alias: "TestUserAlias",
    cell: "555-555-5555",
    email: "testuser@example.com"
  }
) {
  const user = new User(userInfo);
  try {
    await user.save();
    console.log("created user");
    console.log(user);
    return user;
  } catch (err) {
    console.error("Error saving user");
    return false;
  }
}

async function createContact(campaignId) {
  const contact = new CampaignContact({
    first_name: "Ann",
    last_name: "Lewis",
    cell: "5555555555",
    zip: "12345",
    campaign_id: campaignId
  });
  try {
    await contact.save();
    console.log("created contact");
    console.log(contact);
    return contact;
  } catch (err) {
    console.error("Error saving contact: ", err);
    return false;
  }
}

async function createInvite() {
  const inviteQuery = `mutation {
    createInvite(invite: {is_valid: true}) {
      id
    }
  }`;
  const contextValue = getContext();
  try {
    const invite = await graphql({
      schema,
      source: inviteQuery,
      rootValue,
      contextValue
    });
    return invite;
  } catch (err) {
    console.error("Error creating invite");
    return false;
  }
}

async function createOrganization(user, name, userId, inviteId) {
  const contextValue = getContext({ user });

  const orgQuery = `mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
    createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
      id
      uuid
      name
      textingHoursEnforced
      textingHoursStart
      textingHoursEnd
    }
  }`;

  const variableValues = {
    userId,
    name,
    inviteId
  };

  try {
    const org = await graphql({
      schema,
      source: orgQuery,
      rootValue,
      contextValue,
      variableValues
    });
    return org;
  } catch (err) {
    console.error("Error creating organization");
    return false;
  }
}

async function createCampaign(user, title, description, organizationId) {
  const contextValue = getContext({ user });

  const campaignQuery = `mutation createCampaign($input: CampaignInput!) {
    createCampaign(campaign: $input) {
      id
      title
    }
  }`;
  const variableValues = {
    input: {
      title,
      description,
      organizationId
    }
  };

  try {
    const campaign = await graphql({
      schema,
      source: campaignQuery,
      rootValue,
      contextValue,
      variableValues
    });
    return campaign;
  } catch (err) {
    console.error("Error creating campaign");
    return false;
  }
}

// graphQL tests

describe("graphql test suite", () => {
  beforeAll(
    async () => await setupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );
  afterAll(
    async () => await cleanupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );

  it("should be undefined when user not logged in", async () => {
    const query = `{
      currentUser {
        id
      }
    }`;
    const contextValue = getContext();
    const result = await graphql({
      schema,
      source: query,
      rootValue,
      contextValue
    });
    const data = result;

    expect(typeof data.currentUser).toEqual("undefined");
  });

  it("should return the current user when user is logged in", async () => {
    testAdminUser = await createUser();
    const query = `{
      currentUser {
        email
      }
    }`;
    const contextValue = getContext({ user: testAdminUser });
    const result = await graphql({
      schema,
      source: query,
      rootValue,
      contextValue
    });
    const { data } = result;

    expect(data.currentUser.email).toBe("testuser@example.com");
  });

  // TESTING CAMPAIGN CREATION FROM END TO END

  it("should create an invite", async () => {
    testInvite = await createInvite();

    expect(testInvite.data.createInvite.id).toBeTruthy();
  });

  it("should convert an invitation and user into a valid organization instance", async () => {
    if (testInvite && testAdminUser) {
      console.log("user and invite for org");
      console.log([testAdminUser, testInvite.data]);

      testOrganization = await createOrganization(
        testAdminUser,
        "Testy test organization",
        testInvite.data.createInvite.id,
        testInvite.data.createInvite.id
      );

      expect(testOrganization.data.createOrganization.name).toBe(
        "Testy test organization"
      );
    } else {
      console.log("Failed to create invite and/or user for organization test");
      return false;
    }
  });

  it("should create a test campaign", async () => {
    const campaignTitle = "test campaign";
    testCampaign = await createCampaign(
      testAdminUser,
      campaignTitle,
      "test description",
      testOrganization.data.createOrganization.id
    );

    expect(testCampaign.data.createCampaign.title).toBe(campaignTitle);
  });

  it("should create campaign contacts", async () => {
    const contact = await createContact(testCampaign.data.createCampaign.id);
    expect(contact.campaign_id).toBe(
      parseInt(testCampaign.data.createCampaign.id)
    );
  });

  it("should assign texters to campaign contacts", async () => {
    const campaignEditQuery = `
    mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
      editCampaign(id: $campaignId, campaign: $campaign) {
        id
        title
        description
        dueBy
        isStarted
        isArchived
        contactsCount
        ingestMethodsAvailable {
          name
          displayName
        }
        customFields
        texters {
          id
          firstName
          assignment(campaignId:$campaignId) {
            contactsCount
            needsMessageCount: contactsCount(contactsFilter:{messageStatus:\"needsMessage\"})
          }
        }
        interactionSteps {
          id
          questionText
          script
          answerOption
          answerActions
          parentInteractionId
          isDeleted
        }
        cannedResponses {
          id
          title
          text
        }
      }
    }`;
    const contextValue = getContext({ user: testAdminUser });
    const updateCampaign = Object.assign({}, testCampaign.data.createCampaign);
    const campaignId = updateCampaign.id;
    testTexterUser = await helperCreateTexter(testOrganization);

    updateCampaign.texters = [
      {
        id: testTexterUser.id.toString()
      }
    ];
    delete updateCampaign.id;
    delete updateCampaign.contacts;
    const variableValues = {
      campaignId,
      campaign: updateCampaign
    };
    const result = await graphql({
      schema,
      source: campaignEditQuery,
      rootValue,
      contextValue,
      variableValues
    });

    expect(result.data.editCampaign.texters.length).toBe(1);
    expect(result.data.editCampaign.texters[0].assignment.contactsCount).toBe(
      1
    );
  });

  // it('should save a campaign script composed of interaction steps', async() => {})

  // it('should save some canned responses for texters', async() => {})

  // it('should start the campaign', async() => {})

  // TEST STUBS: MESSAGING

  // it('should send an inital message to test contacts', async() => {})

  describe("Campaign", () => {
    let organization;
    const adminUser = { is_superadmin: true, id: 1 };

    beforeEach(async () => {
      organization = await new Organization({
        name: "organization",
        texting_hours_start: 0,
        texting_hours_end: 0
      }).save();
    });

    describe("contacts", () => {
      let campaigns;
      let contacts;
      beforeEach(async () => {
        campaigns = await Promise.all(
          [
            new Campaign({
              organization_id: organization.id,
              is_started: false,
              is_archived: false,
              due_by: new Date()
            }),
            new Campaign({
              organization_id: organization.id,
              is_started: false,
              is_archived: false,
              due_by: new Date()
            })
          ].map(async each => each.save())
        );

        contacts = await Promise.all(
          [
            new CampaignContact({
              campaign_id: campaigns[0].id,
              cell: "",
              message_status: "closed"
            }),
            new CampaignContact({
              campaign_id: campaigns[1].id,
              cell: "",
              message_status: "closed"
            })
          ].map(async each => each.save())
        );
      });

      test("resolves contacts", async () => {
        const results = await campaignResolvers.Campaign.contacts(
          campaigns[0],
          null,
          { user: adminUser }
        );
        expect(results).toHaveLength(1);
        expect(results[0].campaign_id).toEqual(campaigns[0].id);
      });

      test("resolves contacts count", async () => {
        const results = await campaignResolvers.Campaign.contactsCount(
          campaigns[0],
          null,
          { user: adminUser }
        );
        expect(results).toEqual(1);
      });

      test("resolves contacts count when empty", async () => {
        const campaign = await new Campaign({
          organization_id: organization.id,
          is_started: false,
          is_archived: false,
          due_by: new Date()
        }).save();
        const results = await campaignResolvers.Campaign.contactsCount(
          campaign,
          null,
          { user: adminUser }
        );
        expect(results).toEqual(0);
      });
    });

    describe("unassigned contacts", () => {
      let campaign;

      beforeEach(async () => {
        campaign = await new Campaign({
          organization_id: organization.id,
          is_started: false,
          is_archived: false,
          use_dynamic_assignment: true,
          due_by: new Date()
        }).save();
      });

      test("resolves unassigned contacts when true", async () => {
        const contact = await new CampaignContact({
          campaign_id: campaign.id,
          message_status: "needsMessage",
          cell: ""
        }).save();

        const results = await campaignResolvers.Campaign.hasUnassignedContacts(
          campaign,
          null,
          { user: adminUser }
        );
        expect(results).toEqual(true);
        const resultsForTexter = await campaignResolvers.Campaign.hasUnassignedContactsForTexter(
          campaign,
          null,
          { user: adminUser }
        );
        expect(resultsForTexter).toEqual(true);
      });

      test("resolves unassigned contacts when false with assigned contacts", async () => {
        const user = await new User({
          auth0_id: "test123",
          first_name: "TestUserFirst",
          last_name: "TestUserLast",
          cell: "555-555-5555",
          email: "testuser@example.com"
        }).save();

        const assignment = await new Assignment({
          user_id: user.id,
          campaign_id: campaign.id
        }).save();

        const contact = await new CampaignContact({
          campaign_id: campaign.id,
          assignment_id: assignment.id,
          message_status: "closed",
          cell: ""
        }).save();

        const results = await campaignResolvers.Campaign.hasUnassignedContacts(
          campaign,
          null,
          { user: adminUser }
        );
        expect(results).toEqual(false);
        const resultsForTexter = await campaignResolvers.Campaign.hasUnassignedContactsForTexter(
          campaign,
          null,
          { user: adminUser }
        );
        expect(resultsForTexter).toEqual(false);
      });

      test("resolves unassigned contacts when false with no contacts", async () => {
        const results = await campaignResolvers.Campaign.hasUnassignedContacts(
          campaign,
          null,
          { user: adminUser }
        );
        expect(results).toEqual(false);
      });
    });

    describe("Copy Campaign", () => {
      let campaign;
      let copiedCampaign;
      let grandpaInteraction;
      let parantInteraction;
      let childInteraction;
      let cannedResponseOne;
      let cannedResponseTwo;
      let cannedResponseThree;
      let queryHelper;
      beforeEach(async () => {
        // creating an owner user and a relation to the organization created upper scope
        const userTest = await createUser();
        await new UserOrganization({
          user_id: userTest.id,
          organization_id: organization.id,
          role: "OWNER"
        }).save();

        const now = new Date();
        const dueBy = isSqlite ? now.getTime() : now;

        // creating campaign, interactions (two levels down), and canned responses
        campaign = await new Campaign({
          organization_id: organization.id,
          title: "My campaign",
          description: "This is my new campaign",
          is_started: false,
          is_archived: false,
          due_by: dueBy,
          features: JSON.stringify({ MY_FEATURE: "value 1" }),
          intro_html: "<p>This is my intro HTML.</p>",
          primary_color: "#112233",
          logo_image_url: "https://www.example.com/image1",
          override_organization_texting_hours: true,
          texting_hours_enforced: true,
          texting_hours_start: 13,
          texting_hours_end: 14,
          timezone: "MY_TZ",
          use_dynamic_assignment: true
        }).save();
        grandpaInteraction = new InteractionStep({
          campaign_id: campaign.id,
          question: "Favorite color",
          script: "Hi {firstName}! What's your favorite color?",
          parent_interaction_id: null
        });
        await grandpaInteraction.save();
        parantInteraction = new InteractionStep({
          campaign_id: campaign.id,
          parent_interaction_id: grandpaInteraction.id,
          answer_option: "Blue"
        });
        await parantInteraction.save();
        childInteraction = new InteractionStep({
          campaign_id: campaign.id,
          parent_interaction_id: parantInteraction.id,
          answer_option: "Thanks. Blue is Awesome!"
        });
        await childInteraction.save();
        cannedResponseOne = new CannedResponse({
          campaign_id: campaign.id,
          text: "Hello {firstName}",
          title: "Hello"
        });
        cannedResponseTwo = new CannedResponse({
          campaign_id: campaign.id,
          text: "Just check in",
          title: "Check in"
        });
        cannedResponseThree = new CannedResponse({
          campaign_id: campaign.id,
          text: "Good bye {firstName}",
          title: "GoodBye"
        });
        await Promise.all([
          cannedResponseOne.save(),
          cannedResponseTwo.save(),
          cannedResponseThree.save()
        ]);
        // a helper function to help querying both the original and copied campaign
        queryHelper = async (table, campaignId) => {
          const response = await r
            .knex(table)
            .where({ campaign_id: campaignId });
          return response;
        };
        // invoke the method being tested, emulating the loader
        copiedCampaign = await resolvers.RootMutation.copyCampaign(
          null,
          campaign,
          {
            user: userTest,
            loaders: {
              campaign: {
                load: async id => {
                  const findCampaign = await r.knex("campaign").where({ id });
                  return findCampaign[0];
                }
              }
            }
          }
        );
      });
      test("creates and returns a copy of the campaign", () => {
        // The IDs should be different.
        expect(copiedCampaign.id).not.toEqual(campaign.id);
        // The title should start with the "COPY - " prefix.
        expect(copiedCampaign.title).toEqual(`COPY - ${campaign.title}`);
        // The copy should not be started.
        expect(copiedCampaign.is_started).toEqual(false);
        // The copy should not be archived.
        expect(copiedCampaign.is_archived).toEqual(false);
        // All of the other properties should be identical.
        expect(copiedCampaign.description).toEqual(campaign.description);
        if (
          typeof copiedCampaign.due_by === "number" ||
          typeof copiedCampaign.due_by === "string"
        ) {
          const parsedDate = new Date(copiedCampaign.due_by);
          expect(parsedDate).toEqual(campaign.due_by);
        } else if (isSqlite) {
          expect(copiedCampaign.due_by.getTime()).toEqual(campaign.due_by);
        } else {
          expect(copiedCampaign.due_by).toEqual(campaign.due_by);
        }

        if (
          typeof copiedCampaign.features === "object" &&
          copiedCampaign.features
        ) {
          const jsonString = JSON.stringify(copiedCampaign.features);
          expect(jsonString).toEqual(campaign.features);
        } else {
          expect(copiedCampaign.features).toEqual(campaign.features);
        }
        expect(copiedCampaign.intro_html).toEqual(campaign.intro_html);
        expect(copiedCampaign.primary_color).toEqual(campaign.primary_color);
        expect(copiedCampaign.logo_image_url).toEqual(campaign.logo_image_url);
        expect(!!copiedCampaign.override_organization_texting_hours).toEqual(
          !!campaign.override_organization_texting_hours
        );
        expect(!!copiedCampaign.texting_hours_enforced).toEqual(
          !!campaign.texting_hours_enforced
        );
        expect(copiedCampaign.texting_hours_start).toEqual(
          campaign.texting_hours_start
        );
        expect(copiedCampaign.texting_hours_end).toEqual(
          campaign.texting_hours_end
        );
        expect(copiedCampaign.timezone).toEqual(campaign.timezone);
        expect(!!copiedCampaign.use_dynamic_assignment).toEqual(
          !!campaign.use_dynamic_assignment
        );
      });
      test("the copied campaign has the same canned response as the original one", async () => {
        const originalCannedResponseP = queryHelper(
          "canned_response",
          campaign.id
        );
        const copiedCannedResponseP = queryHelper(
          "canned_response",
          copiedCampaign.id
        );
        const [
          originalCannedResponse,
          copiedCannedResponse
        ] = await Promise.all([originalCannedResponseP, copiedCannedResponseP]);
        const originalCannedFiltered = originalCannedResponse.map(el => ({
          text: el.text,
          title: el.title
        }));
        const copiedFiltered = copiedCannedResponse.map(el => ({
          text: el.text,
          title: el.title
        }));
        expect(copiedCannedResponse).toHaveLength(
          originalCannedResponse.length
        );
        originalCannedFiltered.forEach(response => {
          expect(copiedFiltered).toContainEqual(response);
        });
      });
      test("the copied campaign has the same interactions as the original one", async () => {
        const originalInteractionsP = queryHelper(
          "interaction_step",
          campaign.id
        );
        const copiedInteractionsP = queryHelper(
          "interaction_step",
          copiedCampaign.id
        );
        const [originalInteractions, copiedInteractions] = await Promise.all([
          originalInteractionsP,
          copiedInteractionsP
        ]);
        const originalIntFiltered = originalInteractions.map(int => ({
          question: int.question,
          script: int.script,
          answer_option: int.answer_option,
          answer_actions: int.answer_actions
        }));
        const copiedIntFiltered = copiedInteractions.map(int => ({
          question: int.question,
          script: int.script,
          answer_option: int.answer_option,
          answer_actions: int.answer_actions
        }));
        expect(copiedInteractions).toHaveLength(originalInteractions.length);
        originalIntFiltered.forEach(interaction => {
          expect(copiedIntFiltered).toContainEqual(interaction);
        });
      });
    });
  });

  describe("Contact schema", () => {
    test("has an alias field", async () => {
      // create a default user...
      const user = await createUser();
      // ...and check if it's on the DB. The object being returned in the above function is not the db instance.
      const userFromDB = await User.getAll(user.id);
      expect(userFromDB[0].alias).toEqual("TestUserAlias");
    });
    test("the alias field defaults to null", async () => {
      const userWithoutAliasObj = {
        auth0_id: "test123",
        first_name: "TestUserFirst",
        last_name: "TestUserLast",
        cell: "555-555-5555",
        email: "testuser@example.com"
      };
      const user = await createUser(userWithoutAliasObj);
      const userFromDB = await User.getAll(user.id);
      expect(userFromDB[0].alias).toBeNull();
    });
  });
});

describe("editUser mutation", () => {
  let testTexter;
  let organizationId;
  let variables;

  beforeEach(async () => {
    await setupTest();
    testAdminUser = await helperCreateUser();
    testOrganization = await helperCreateOrganization(
      testAdminUser,
      await helperCreateInvite()
    );
    organizationId = testOrganization.data.createOrganization.id;
    testTexter = await helperCreateTexter(testOrganization);

    variables = {
      organizationId,
      userId: testTexter.id,
      userData: null
    };
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("returns the user if it is called with a userId by no userData", async () => {
    const result = await runGql(editUserMutation, variables, testAdminUser);
    expect(result).toMatchObject({
      data: {
        editUser: {
          // id: "2", // id might be diff
          firstName: "TestTexterFirst",
          lastName: "TestTexterLast",
          cell: "555-555-6666",
          email: "testtexter@example.com"
        }
      }
    });
  });

  it("updates the user if it is called with a userId and userData", async () => {
    const userData = {
      firstName: "Jerry",
      lastName: "Garcia",
      alias: "JG",
      email: "jerry@heaven.org",
      cell: "4151111111",
      extra: null
    };

    variables.userData = userData;

    // the mutation returns the right thing
    const result = await runGql(editUserMutation, variables, testAdminUser);
    expect(result).toEqual({
      data: {
        editUser: {
          ...userData,
          profileComplete: true,
          id: testTexter.id.toString()
        }
      }
    });

    // it gets updated in the database
    const updatedUser = await r.knex("user").where("id", testTexter.id);
    expect(updatedUser[0]).toMatchObject({
      first_name: userData.firstName,
      last_name: userData.lastName,
      alias: userData.alias,
      email: userData.email,
      cell: userData.cell,
      id: testTexter.id
    });
  });
});
