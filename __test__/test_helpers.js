import _ from "lodash";
import {
  createLoaders,
  createTables,
  dropTables,
  User,
  CampaignContact,
  r
} from "../src/server/models/";
import { graphql } from "graphql";

export async function setupTest() {
  await createTables();
}

export async function cleanupTest() {
  await dropTables();
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders()
  };
}

export async function createUser(
  userInfo = {},
  organizationId = null,
  role = null
) {
  const defaultUserInfo = {
    auth0_id: "test123",
    first_name: "TestUserFirst",
    last_name: "TestUserLast",
    cell: "555-555-5555",
    email: "testuser@example.com"
  };
  const user = new User({
    ...defaultUserInfo,
    ...userInfo
  });
  await user.save();
  if (organizationId && role) {
    await r.knex("user_organization").insert({
      user_id: user.id,
      organization_id: organizationId,
      role
    });
  }
  return user;
}

export async function createContacts(campaign, count = 1) {
  const campaignId = campaign.id;
  const contacts = [];
  const startNum = "+15155500000";
  for (let i = 0; i < count; i++) {
    const contact = new CampaignContact({
      first_name: `Ann${i}`,
      last_name: `Lewis${i}`,
      cell: startNum.substr(0, startNum.length - String(i).length) + String(i),
      zip: "12345",
      campaign_id: campaignId
    });
    await contact.save();
    contacts.push(contact);
  }
  return contacts;
}

import { makeExecutableSchema } from "graphql-tools";
import { resolvers } from "../src/server/api/schema";
import { schema } from "../src/api/schema";

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: true
});

/**
 * Get the text for a query parsed with the gql tag
 */
function getGqlOperationText(op) {
  return op.loc && op.loc.source.body;
}

export async function runGql(operation, vars, user) {
  const operationText = getGqlOperationText(operation) || operation;
  const rootValue = {};
  const context = getContext({ user });
  const result = await graphql(
    mySchema,
    operationText,
    rootValue,
    context,
    vars
  );
  if (result && result.errors) {
    console.log("runGql failed " + JSON.stringify(result));
  }
  return result;
}

export const updateUserRoles = async (
  adminUser,
  organizationId,
  userId,
  roles
) => {
  const query = `mutation editOrganizationRoles(
      $organizationId: String!,
      $userId: String!,
      $roles: [String]) {
    editOrganizationRoles(userId: $userId, organizationId: $organizationId, roles: $roles) {
      id
    }
  }`;

  const variables = {
    organizationId,
    userId,
    roles
  };
  const result = await runGql(query, variables, adminUser);
  if (result && result.errors) {
    throw new Exception(
      "editOrganizationRoles failed " + JSON.stringify(result)
    );
  }
  return result;
};

export async function createInvite() {
  const rootValue = {};
  const inviteQuery = `mutation {
    createInvite(invite: {is_valid: true}) {
      id
    }
  }`;
  const context = getContext();
  return await graphql(mySchema, inviteQuery, rootValue, context);
}

export async function createOrganization(user, invite) {
  const rootValue = {};
  const name = "Testy test organization";
  const userId = user.id;
  const inviteId = invite.data.createInvite.id;

  const context = getContext({ user });

  const orgQuery = `mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
    createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
      id
      uuid
    }
  }`;

  const variables = {
    userId,
    name,
    inviteId
  };
  return await graphql(mySchema, orgQuery, rootValue, context, variables);
}

export async function setTwilioAuth(user, organization) {
  const rootValue = {};
  const accountSid = "test_twilio_account_sid";
  const authToken = "test_twlio_auth_token";
  const messageServiceSid = "test_message_service";
  const orgId = organization.data.createOrganization.id;

  const context = getContext({ user });

  const twilioQuery = `
      mutation updateTwilioAuth(
        $twilioAccountSid: String
        $twilioAuthToken: String
        $twilioMessageServiceSid: String
        $organizationId: String!
      ) {
        updateTwilioAuth(
          twilioAccountSid: $twilioAccountSid
          twilioAuthToken: $twilioAuthToken
          twilioMessageServiceSid: $twilioMessageServiceSid
          organizationId: $organizationId
        ) {
          id
          twilioAccountSid
          twilioAuthToken
          twilioMessageServiceSid
        }
      }`;

  const variables = {
    organizationId: orgId,
    twilioAccountSid: accountSid,
    twilioAuthToken: authToken,
    twilioMessageServiceSid: messageServiceSid
  };

  const result = await graphql(
    mySchema,
    twilioQuery,
    rootValue,
    context,
    variables
  );
  if (result && result.errors) {
    console.log("updateTwilioAuth failed " + JSON.stringify(result));
  }
  return result;
}

export async function createCampaign(
  user,
  organization,
  title = "test campaign",
  args = {}
) {
  const rootValue = {};
  const description = "test description";
  const organizationId = organization.data.createOrganization.id;
  const context = getContext({ user });

  const campaignQuery = `mutation createCampaign($input: CampaignInput!) {
    createCampaign(campaign: $input) {
      id
    }
  }`;
  const variables = {
    input: {
      title,
      description,
      organizationId,
      ...args
    }
  };
  const result = await graphql(
    mySchema,
    campaignQuery,
    rootValue,
    context,
    variables
  );
  if (result.errors) {
    throw new Exception("Create campaign failed " + JSON.stringify(result));
  }
  return result.data.createCampaign;
}

export async function saveCampaign(
  user,
  campaign,
  title = "test campaign",
  useOwnMessagingService = "false"
) {
  const rootValue = {};
  const description = "test description";
  const organizationId = campaign.organizationId;
  const context = getContext({ user });

  const campaignQuery = `mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
      title
      useOwnMessagingService
    }
  }`;

  const variables = {
    campaign: {
      title,
      description,
      organizationId,
      useOwnMessagingService
    },
    campaignId: campaign.id
  };
  const result = await graphql(
    mySchema,
    campaignQuery,
    rootValue,
    context,
    variables
  );
  if (result.errors) {
    throw new Exception("Create campaign failed " + JSON.stringify(result));
  }
  return result.data.editCampaign;
}

export async function copyCampaign(campaignId, user) {
  const rootValue = {};
  const query = `mutation copyCampaign($campaignId: String!) {
    copyCampaign(id: $campaignId) {
      id
    }
  }`;
  const context = getContext({ user });
  return await graphql(mySchema, query, rootValue, context, { campaignId });
}

export async function createTexter(organization, userInfo = {}) {
  const rootValue = {};
  const defaultUserInfo = {
    auth0_id: "test456",
    first_name: "TestTexterFirst",
    last_name: "TestTexterLast",
    cell: "555-555-6666",
    email: "testtexter@example.com"
  };
  const user = await createUser(
    { ...defaultUserInfo, ...userInfo },
    organization.data.createOrganization.id,
    "TEXTER"
  );
  if (user.errors) {
    throw new Exception("createUsers failed " + JSON.stringify(user));
  }
  const joinQuery = `
  mutation joinOrganization($organizationUuid: String!) {
    joinOrganization(organizationUuid: $organizationUuid) {
      id
    }
  }`;
  const variables = {
    organizationUuid: organization.data.createOrganization.uuid
  };
  const context = getContext({ user });
  const result = await graphql(
    mySchema,
    joinQuery,
    rootValue,
    context,
    variables
  );
  if (result.errors) {
    throw new Exception("joinOrganization failed " + JSON.stringify(result));
  }
  return user;
}

export async function assignTexter(admin, user, campaign, assignments) {
  // optional argument assignments could look like:
  // [{id: userId1, needsMessageCount: 10}, {id: userId2, needsMessageCount: 100}]
  // needsMessageCount: total desired number of unmessaged contacts
  // contactsCount: (messagedCount from texter) + needsMessageCount (above)
  // If a userId has an existing assignment, then, also include `contactsCount: <current>`
  const rootValue = {};
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
    }
  }`;
  const context = getContext({ user: admin });
  const updateCampaign = Object.assign({}, campaign);
  const campaignId = updateCampaign.id;
  updateCampaign.texters = assignments || [
    {
      id: user.id
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
  if (result.errors) {
    throw new Exception("assignTexter failed " + JSON.stringify(result));
  }
  return result;
}

export async function sendMessage(campaignContactId, user, message) {
  const rootValue = {};
  const query = `
    mutation sendMessage($message: MessageInput!, $campaignContactId: String!) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
          id
          messageStatus
          messages {
            id
            createdAt
            text
            isFromContact
          }
        }
      }`;
  const context = getContext({ user });
  const variables = {
    message,
    campaignContactId
  };
  const result = await graphql(mySchema, query, rootValue, context, variables);
  if (result.errors) {
    console.log("sendMessage errors", result);
  }
  return result;
}

export async function bulkSendMessages(assignmentId, user) {
  const query = `
    mutation bulkSendMessage($assignmentId: Int!) {
        bulkSendMessages(assignmentId: $assignmentId) {
          id
        }
      }`;
  const variables = {
    assignmentId
  };
  return runGql(query, variables, user);
}

export function buildScript(steps = 2, choices = 1) {
  const makeStep = (step, max, choice = "") => ({
    id: `new${step}_${choice}`,
    questionText: `hmm${step}`,
    script:
      step === 1
        ? "{lastName}"
        : step === 0
        ? "autorespond {zip}"
        : `${choice}Step Script ${step}`,
    answerOption: `${choice}hmm${step}`,
    answerActions: "",
    parentInteractionId: step > 0 ? "new" + (step - 1) + "_" : null,
    isDeleted: false,
    interactionSteps: choice ? [] : createSteps(step + 1, max)
  });
  const createSteps = (step, max) => {
    if (max <= step) {
      return [];
    }
    const rv = [makeStep(step, max)];
    for (let i = 1; i < choices; i++) {
      rv.push(makeStep(step, max, i));
    }
    return rv;
  };
  return createSteps(0, steps);
}

export async function createScript(
  admin,
  campaign,
  { interactionSteps, steps = 2, choices = 1, campaignGqlFragment } = {}
) {
  const rootValue = {};
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      ${campaignGqlFragment || "id"}
    }
  }`;
  // function to create a recursive set of steps of arbitrary depth
  let builtInteractionSteps;

  if (!interactionSteps) {
    builtInteractionSteps = buildScript(steps, choices);
  }

  const context = getContext({ user: admin });
  const campaignId = campaign.id;
  const variables = {
    campaignId,
    campaign: {
      interactionSteps: interactionSteps || builtInteractionSteps[0]
    }
  };
  return await graphql(
    mySchema,
    campaignEditQuery,
    rootValue,
    context,
    variables
  );
}

export async function createCannedResponses(admin, campaign, cannedResponses) {
  // cannedResponses: {title, text}
  const rootValue = {};
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
    }
  }`;
  const context = getContext({ user: admin });
  const campaignId = campaign.id;
  const variables = {
    campaignId,
    campaign: {
      cannedResponses
    }
  };
  return await graphql(
    mySchema,
    campaignEditQuery,
    rootValue,
    context,
    variables
  );
}

jest.mock("../src/server/mail");
export async function startCampaign(admin, campaign) {
  const rootValue = {};
  const startCampaignQuery = `mutation startCampaign($campaignId: String!) {
    startCampaign(id: $campaignId) {
      id
    }
  }`;
  const context = getContext({ user: admin });
  const variables = { campaignId: campaign.id };
  return await graphql(
    mySchema,
    startCampaignQuery,
    rootValue,
    context,
    variables
  );
}

export async function getCampaignContact(id) {
  return await r
    .knex("campaign_contact")
    .where({ id })
    .first();
}

export async function getOptOut(assignmentId, cell) {
  return await r
    .knex("opt_out")
    .where({
      cell,
      assignment_id: assignmentId
    })
    .first();
}

export async function createStartedCampaign() {
  const testAdminUser = await createUser();
  const testInvite = await createInvite();
  const testOrganization = await createOrganization(testAdminUser, testInvite);
  const organizationId = testOrganization.data.createOrganization.id;
  const testCampaign = await createCampaign(testAdminUser, testOrganization);
  const testContacts = await createContacts(testCampaign, 100);
  const testTexterUser = await createTexter(testOrganization);
  const testTexterUser2 = await createTexter(testOrganization);
  await startCampaign(testAdminUser, testCampaign);

  await assignTexter(testAdminUser, testTexterUser, testCampaign);
  const dbCampaignContact = await getCampaignContact(testContacts[0].id);
  const assignmentId = dbCampaignContact.assignment_id;
  const assignment = (await r.knex("assignment").where("id", assignmentId))[0];

  const testSuperAdminUser = await createUser(
    {
      auth0_id: "2024561111",
      first_name: "super",
      last_name: "admin",
      cell: "202-456-1111",
      email: "superadmin@example.com",
      is_superadmin: true
    },
    organizationId,
    "ADMIN"
  );

  return {
    testAdminUser,
    testInvite,
    testOrganization,
    testCampaign,
    testTexterUser,
    testTexterUser2,
    testContacts,
    assignmentId,
    assignment,
    testSuperAdminUser,
    organizationId,
    dbCampaignContact
  };
}

export const getConversations = async (
  user,
  organizationId,
  contactsFilter,
  campaignsFilter,
  assignmentsFilter
) => {
  const cursor = {
    offset: 0,
    limit: 1000
  };
  const variables = {
    cursor,
    organizationId,
    contactsFilter,
    campaignsFilter,
    assignmentsFilter
  };

  const conversationsQuery = `
    query Q(
          $organizationId: String!
          $cursor: OffsetLimitCursor!
          $contactsFilter: ContactsFilter
          $campaignsFilter: CampaignsFilter
          $assignmentsFilter: AssignmentsFilter
          $utc: String
        ) {
          conversations(
            cursor: $cursor
            organizationId: $organizationId
            campaignsFilter: $campaignsFilter
            contactsFilter: $contactsFilter
            assignmentsFilter: $assignmentsFilter
            utc: $utc
          ) {
            pageInfo {
              limit
              offset
              total
            }
            conversations {
              texter {
                id
                displayName
                roles(organizationId: $organizationId)
              }
              contact {
                id
                assignmentId
                firstName
                lastName
                cell
                messageStatus
                messages {
                  id
                  text
                  isFromContact
                }
                optOut {
                  cell
                }
              }
              campaign {
                id
                title
              }
            }
          }
        }
      `;

  return runGql(conversationsQuery, variables, user);
};

export const createJob = async (campaign, overrides) => {
  const job = {
    campaign_id: campaign.id,
    payload: "fake_payload",
    queue_name: "1:fake_queue_name",
    job_type: "fake_job_type",
    locks_queue: true,
    assigned: true,
    status: 0,
    ...(overrides && overrides)
  };

  const [job_id] = await r
    .knex("job_request")
    .returning("id")
    .insert(job);
  job.id = job_id;

  return job;
};

export const makeRunnableMutations = (mutationsToWrap, user, ownProps) => {
  const newMutations = {};
  Object.keys(mutationsToWrap).forEach(k => {
    newMutations[k] = async (...args) => {
      // TODO validate received args against args in the schema
      const toWrap = mutationsToWrap[k](ownProps)(...args);
      return runGql(toWrap.mutation, toWrap.variables, user);
    };
  });
  return newMutations;
};

export const runComponentQueries = async (queries, user, ownProps) => {
  const keys = Object.keys(queries);
  const promises = keys.map(k => {
    const query = queries[k];
    const opts = query.options(ownProps);
    return runGql(query.query, opts.variables, user);
  });

  const resolvedPromises = await Promise.all(promises);

  const queryResults = {};
  for (let i = 0; i < keys.length; i++) {
    const dataKey = Object.keys(resolvedPromises[i].data)[0];
    const key = keys[i];
    queryResults[key] = {
      // as implemented here refetch does not hit the resolvers
      // and returns the data that was originally feteched
      refetch: async () => {
        return Promise.resolve(resolvedPromises[i].data[dataKey]);
      }
    };
    queryResults[key][dataKey] = resolvedPromises[i].data[dataKey];
  }

  return queryResults;
};
