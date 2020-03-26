import { resolvers } from "../src/server/api/schema";
import { schema } from "../src/api/schema";
import { assignmentRequired } from "../src/server/api/errors";
import { graphql } from "graphql";
import {
  User,
  Organization,
  Campaign,
  CampaignContact,
  Assignment,
  r,
  CannedResponse,
  InteractionStep,
  UserOrganization,
  Tag,
  Message,
  TagCampaignContact
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
import { makeExecutableSchema } from "graphql-tools";

import { editUserMutation } from "../src/containers/UserEdit.jsx";

const mySchema = makeExecutableSchema({
  typeDefs: schema,
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
  const context = getContext();
  try {
    const invite = await graphql(mySchema, inviteQuery, rootValue, context);
    return invite;
  } catch (err) {
    console.error("Error creating invite");
    return false;
  }
}

async function createOrganization(user, name, userId, inviteId) {
  const context = getContext({ user });

  const orgQuery = `mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
    createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
      id
      uuid
      name
      threeClickEnabled
      textingHoursEnforced
      textingHoursStart
      textingHoursEnd
    }
  }`;

  const variables = {
    userId,
    name,
    inviteId
  };

  try {
    const org = await graphql(
      mySchema,
      orgQuery,
      rootValue,
      context,
      variables
    );
    return org;
  } catch (err) {
    console.error("Error creating organization");
    return false;
  }
}

async function createCampaign(user, title, description, organizationId) {
  const context = getContext({ user });
  const campaignQuery = `mutation createCampaign($input: CampaignInput!) {
    createCampaign(campaign: $input) {
      id
      title
    }
  }`;
  const variables = {
    input: {
      title,
      description,
      organizationId
    }
  };

  try {
    const campaign = await graphql(
      mySchema,
      campaignQuery,
      rootValue,
      context,
      variables
    );
    return campaign;
  } catch (err) {
    console.error("Error creating campaign");
    return false;
  }
}

async function createMessage(contact, text, campaignContactId) {
  const { cell } = contact;
  const newMessage = new Message({
    contact_number: cell,
    is_from_contact: false,
    text,
    send_status: "SENT",
    campaign_contact_id: campaignContactId
  });
  try {
    const messageCreated = await newMessage.save();
    return messageCreated;
  } catch (e) {
    return false;
  }
}

// graphQL tests

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
  const context = getContext();
  const result = await graphql(mySchema, query, rootValue, context);
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
  const context = getContext({ user: testAdminUser });
  const result = await graphql(mySchema, query, rootValue, context);
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

it("should add texters to a organization", async () => {
  testTexterUser = await createUser({
    auth0_id: "test456",
    first_name: "TestTexterFirst",
    last_name: "TestTexterLast",
    cell: "555-555-6666",
    email: "testtexter@example.com"
  });
  const joinQuery = `
  mutation joinOrganization($organizationUuid: String!) {
    joinOrganization(organizationUuid: $organizationUuid) {
      id
    }
  }`;
  const variables = {
    organizationUuid: testOrganization.data.createOrganization.uuid
  };
  const context = getContext({ user: testTexterUser });
  const result = await graphql(
    mySchema,
    joinQuery,
    rootValue,
    context,
    variables
  );
  expect(result.data.joinOrganization.id).toBeTruthy();
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
  const context = getContext({ user: testAdminUser });
  const updateCampaign = Object.assign({}, testCampaign.data.createCampaign);
  const campaignId = updateCampaign.id;
  updateCampaign.texters = [
    {
      id: testTexterUser.id
    }
  ];
  delete updateCampaign.id;
  delete updateCampaign.contacts;
  const variables = {
    campaignId,
    campaign: updateCampaign
  };
  const result = await graphql(
    mySchema,
    campaignEditQuery,
    rootValue,
    context,
    variables
  );

  expect(result.data.editCampaign.texters.length).toBe(1);
  expect(result.data.editCampaign.texters[0].assignment.contactsCount).toBe(1);
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

  describe("contacts", async () => {
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

    test("test assignmentRequired access control", async () => {
      const user = await createUser();

      const assignment = await new Assignment({
        user_id: user.id,
        campaign_id: campaign.id
      }).save();

      const allowUser = await assignmentRequired(
        user,
        assignment.id,
        assignment
      );
      expect(allowUser).toEqual(true);
      const allowUserAssignmentId = await assignmentRequired(
        user,
        assignment.id
      );
      expect(allowUserAssignmentId.user_id).toEqual(user.id);
      expect(allowUserAssignmentId.id).toEqual(assignment.id);
      try {
        const notAllowed = await assignmentRequired(user, -1);
        throw new Exception("should throw BEFORE this exception");
      } catch (err) {
        expect(/not authorized/.test(String(err))).toEqual(true);
      }
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
      // creating campaign, interactions (two levels down), and canned responses
      campaign = await new Campaign({
        organization_id: organization.id,
        title: "My campaign",
        description: "This is my new campaign",
        is_started: false,
        is_archived: false,
        use_dynamic_assignment: true,
        due_by: new Date()
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
        const response = await r.knex(table).where({ campaign_id: campaignId });
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
      expect(campaign.id).not.toEqual(copiedCampaign.id);
      expect(campaign.description).toEqual(copiedCampaign.description);
      expect(copiedCampaign.title).toEqual(`COPY - ${campaign.title}`);
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
      const [originalCannedResponse, copiedCannedResponse] = await Promise.all([
        originalCannedResponseP,
        copiedCannedResponseP
      ]);
      const originalCannedFiltered = originalCannedResponse.map(el => ({
        text: el.text,
        title: el.title
      }));
      const copiedFiltered = copiedCannedResponse.map(el => ({
        text: el.text,
        title: el.title
      }));
      expect(copiedCannedResponse).toHaveLength(originalCannedResponse.length);
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

describe("editUser mutation", () => {
  let testAdminUser;
  let testTexter;
  let testOrganization;
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
    if (r.redis) r.redis.flushdb();
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
      cell: "4151111111"
    };

    variables.userData = userData;

    // the mutation returns the right thing
    const result = await runGql(editUserMutation, variables, testAdminUser);
    expect(result).toEqual({
      data: {
        editUser: {
          ...userData,
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

describe("A tag table", () => {
  let userTest;
  let inviteTest;
  let organizationTest;
  let campaignTest;
  let contactTest;
  let tagFields;
  let campaignContactFromDB;
  beforeEach(async () => {
    await setupTest();

    // Creating the instances needed to create a new tag and update its content
    userTest = await createUser();
    inviteTest = await createInvite();
    organizationTest = await createOrganization(
      userTest,
      "Test org for tag",
      inviteTest.data.createInvite.id,
      inviteTest.data.createInvite.id
    );
    campaignTest = await createCampaign(
      userTest,
      "A campaign test for tags",
      "A campaign test for tags",
      organizationTest.data.createOrganization.id
    );
    contactTest = await createContact(campaignTest.data.createCampaign.id);

    // createCampaign feeds the campaign_contact table, so we can use it from de db to create the tag content
    campaignContactFromDB = await r.knex("campaign_contact").where({
      campaign_id: contactTest.campaign_id,
      first_name: contactTest.first_name,
      last_name: contactTest.last_name
    });

    // a tag that will be used accross most of the tets
    tagFields = {
      name: "A new tag",
      description: "This is a description for a new tag",
      organization_id: organizationTest.data.createOrganization.id,
      group: "A group for my tag"
    };
    await new Tag(tagFields).save();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("holds all tags with name, description, andr group, and tags belong to organizations", async () => {
    // find from DB the Tag created
    const [tagFromDB] = await Tag.getAll();
    // it should match the object that was used to create it
    expect(tagFromDB).toMatchObject(tagFields);
  });
  it("name, description, and organization cannot be null. Group can be null", async () => {
    // create new Tags, where not nullable fields receive null as their value
    const incompletedTags = [
      { ...tagFields, ...{ name: null } },
      { ...tagFields, ...{ description: null } },
      { ...tagFields, ...{ organization_id: null } }
    ];
    const tagsDBInstance = [];

    incompletedTags.forEach(tag => {
      tagsDBInstance.push(new Tag(tag));
    });

    // For some reason, I couldn't make .toThrow() to work. So catching all errors and comparing with the incompletedTags array
    const catchErrors = [];

    for (let i = 0; i < tagsDBInstance.length; i++) {
      try {
        await tagsDBInstance[i].save();
      } catch (e) {
        catchErrors.push(true);
      }
    }
    expect(catchErrors.length).toBe(incompletedTags.length);
  });
  it("Group can be null", async () => {
    const tagWithoutGroup = { ...tagFields, ...{ group: null } };

    await new Tag(tagWithoutGroup).save();
    const [tagCreated] = await Tag.getAll();
    expect(tagCreated.group).toBe(null);
  });
  it("has a default field 'is_deleted' as false, but can be updated to true", async () => {
    const [tagFromDB] = await Tag.getAll();
    expect(tagFromDB.isDeleted).toBeFalsy();
    await r
      .knex("tag")
      .where({ id: tagFromDB.id })
      .update({ is_deleted: true });
    const [tagFromDBAfterUpdate] = await Tag.getAll();
    expect(tagFromDBAfterUpdate).toBeTruthy();
  });
  describe("and a tag", () => {
    let tagTest;
    let tagCampaignContent;

    beforeEach(async () => {
      await setupTest();

      // Get tag needed to test from the DB
      [tagTest] = await Tag.getAll();

      tagCampaignContent = {
        value: "Tagged a contact",
        tag_id: tagTest.id,
        campaign_contact_id: campaignContactFromDB[0].id
      };

      // Tag a contact! used accross the tests below
      await new TagCampaignContact(tagCampaignContent).save();
    }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

    afterEach(async () => {
      await cleanupTest();
      if (r.redis) r.redis.flushdb();
    }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

    it("is applied to a contact, and associated to a campaign, and can hold a value that explains why that tag was applied to that message", async () => {
      // Check on db if the tag content was created
      const [tagContentFromDB] = await TagCampaignContact.getAll();
      expect(tagContentFromDB).toMatchObject(tagCampaignContent);
    });

    it("one tag can be applied to two different contacts", async () => {
      // Create a new contact..
      const newContact = await createContact(
        campaignTest.data.createCampaign.id
      );
      // get it from db
      const queryTheNewContact = await r.knex("campaign_contact").where({
        campaign_id: newContact.campaign_id,
        first_name: newContact.first_name,
        last_name: newContact.last_name
      });
      // ...and aply the same tag applied to another contact
      const newTagCampaignContact = {
        value: "Tagged a different contact",
        tag_id: tagTest.id,
        campaign_contact_id: queryTheNewContact[0].id
      };
      await new TagCampaignContact(newTagCampaignContact).save();

      const newTagCampaignContactFromDB = await TagCampaignContact.getAll();
      expect(newTagCampaignContactFromDB[0].campaign_contact_id).not.toBe(
        newTagCampaignContactFromDB[1].campaign_contact_id
      );
    });
    it("is possible to tag one contact with two or more tags", async () => {
      const newTagFields = {
        name: "A different tag",
        description: "This is not the same tag",
        organization_id: organizationTest.data.createOrganization.id
      };
      // Create a new tag...
      const newTag = await new Tag(newTagFields).save();
      const newTagCampaignContent = {
        value: "Testing tagging same message two different tags",
        tag_id: newTag.id,
        campaign_contact_id: campaignContactFromDB[0].id
      };
      // and tag a contact that already was tagged
      await new TagCampaignContact(newTagCampaignContent).save();
      const tagContentFromDB = await TagCampaignContact.getAll();
      expect(tagContentFromDB[0].campaign_contact_id).toBe(
        tagContentFromDB[1].campaign_contact_id
      );
      // just check it's not the same tag
      expect(tagContentFromDB[0].tag_id).not.toBe(tagContentFromDB[1].tag_id);
    });
  });
});
