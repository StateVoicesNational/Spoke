import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphql } from "graphql";
import apiSchema from "../src/api/schema";
import { resolvers } from "../src/server/api/schema";
import {
  CampaignContact,
  User,
  cacheableData,
  createLoaders,
  createTables,
  dropTables,
  r
} from "../src/server/models";

// Cypress integration tests do not use jest but do use these helpers
// They would benefit from mocking mail services, though, so something to look in to.
if (global.jest) {
  global.jest.mock("../src/server/mail");
}

export async function setupTest() {
  // FUTURE: only run this once maybe and then truncateTables() from models?
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
  for (let i = 0; i < count; i += 1) {
    const contact = new CampaignContact({
      first_name: `Ann${i}`,
      last_name: `Lewis${i}`,
      cell: startNum.substr(0, startNum.length - String(i).length) + String(i),
      zip: "12345",
      campaign_id: campaignId
    });

    // await in loop to avoid making too many database connections
    // eslint-disable-next-line no-await-in-loop
    await contact.save();

    contacts.push(contact);
  }
  return contacts;
}

const schema = makeExecutableSchema({
  typeDefs: apiSchema,
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
  const source = getGqlOperationText(operation) || operation;
  const rootValue = {};
  const contextValue = getContext({ user });
  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues: vars
  });
  if (result && result.errors) {
    console.log(`runGql failed ${JSON.stringify(result)}`);
  }
  return result;
}

export const updateUserRoles = async (
  adminUser,
  organizationId,
  userId,
  roles
) => {
  const query = `
    mutation editOrganizationRoles(
      $organizationId: String!
      $userId: String!
      $roles: [String]
    ) {
      editOrganizationRoles(
        userId: $userId
        organizationId: $organizationId
        roles: $roles
      ) {
        id
      }
    }
  `;
  const variables = {
    organizationId,
    userId,
    roles
  };
  const result = await runGql(query, variables, adminUser);
  if (result && result.errors) {
    throw new Error(`editOrganizationRoles failed ${JSON.stringify(result)}`);
  }
  return result;
};

export async function createInvite() {
  const rootValue = {};
  const source = `
    mutation {
      createInvite(invite: { is_valid: true }) {
        id
      }
    }
  `;
  const contextValue = getContext();
  return await graphql({
    schema,
    source,
    rootValue,
    contextValue
  });
}

export async function createOrganization(user, invite) {
  const rootValue = {};
  const name = "Testy test organization";
  const userId = user.id;

  const inviteId = invite.data.createInvite.id;

  const contextValue = getContext({ user });

  const source = `
    mutation createOrganization(
      $name: String!
      $userId: String!
      $inviteId: String!
    ) {
      createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
        id
        uuid
      }
    }
  `;

  const variableValues = {
    userId: userId.toString(),
    name,
    inviteId
  };

  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });

  if (result && result.errors) {
    throw new Error(`createOrganization failed ${JSON.stringify(result)}`);
  }
  return result;
}

export const updateOrganizationFeatures = async (
  testOrganization,
  newFeatures,
  testCampaign = null
) => {
  const organization = testOrganization.data.createOrganization;
  const existingFeatures = organization.features || {};
  const features = {
    ...existingFeatures,
    ...newFeatures
  };

  await r
    .knex("organization")
    .where({ id: organization.id })
    .update({ features: JSON.stringify(features) });
  organization.feature = features;
  await cacheableData.organization.clear(organization.id);

  if (testCampaign) {
    await r
      .knex("campaign")
      .where({ id: testCampaign.id })
      .update({ organization_id: organization.id });
    await cacheableData.campaign.clear(testCampaign.id);
  }
};

export const ensureOrganizationTwilioWithMessagingService = async (
  testOrganization,
  testCampaign = null
) => {
  const newFeatures = {
    TWILIO_MESSAGE_SERVICE_SID: global.TWILIO_MESSAGE_SERVICE_SID,
    service: "twilio"
  };
  return updateOrganizationFeatures(
    testOrganization,
    newFeatures,
    testCampaign
  );
};

export async function setTwilioAuth(user, organization) {
  const rootValue = {};
  const twilioAccountSid = "ACtest_twilio_account_sid";
  const twilioAuthToken = "test_twilio_auth_token";
  const twilioMessageServiceSid = "test_message_service";
  const orgId = organization.data.createOrganization.id;

  const contextValue = getContext({ user });

  const source = `
    mutation updateServiceVendorConfig(
      $organizationId: String!
      $serviceName: String!
      $config: JSON!
    ) {
      updateServiceVendorConfig(
        organizationId: $organizationId
        serviceName: $serviceName
        config: $config
      ) {
        id
        config
      }
    }
  `;

  const twilioConfig = {
    twilioAccountSid,
    twilioAuthToken,
    twilioMessageServiceSid
  };

  const variableValues = {
    organizationId: orgId,
    serviceName: "twilio",
    config: JSON.stringify(twilioConfig)
  };

  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
  if (result && result.errors) {
    console.log(`updateServiceVendorConfig failed ${JSON.stringify(result)}`);
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
  const contextValue = getContext({ user });

  const source = `
    mutation createCampaign($input: CampaignInput!) {
      createCampaign(campaign: $input) {
        id
      }
    }
  `;
  const variableValues = {
    input: {
      title,
      description,
      organizationId,
      ...args
    }
  };
  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
  if (result.errors) {
    throw new Error(`Create campaign failed ${JSON.stringify(result)}`);
  }
  return result.data.createCampaign;
}

export async function saveCampaign(
  user,
  campaign,
  title = "test campaign",
  useOwnMessagingService = "false",
  inventoryPhoneNumberCounts = undefined
) {
  const rootValue = {};
  const description = "test description";
  const { organizationId } = campaign;
  const campaignId = campaign.id;
  const contextValue = getContext({ user });

  const source = `
    mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
      editCampaign(id: $campaignId, campaign: $campaign) {
        id
        title
        useOwnMessagingService
      }
    }
  `;
  const variableValues = {
    campaign: {
      title,
      description,
      organizationId
    },
    campaignId
  };
  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
  if (result.errors) {
    throw new Error(`Create campaign failed ${JSON.stringify(result)}`);
  }
  if (useOwnMessagingService !== "false" || inventoryPhoneNumberCounts) {
    const serviceManagerQuery = `
      mutation updateServiceManager(
        $organizationId: String!
        $campaignId: String!
        $serviceManagerName: String!
        $updateData: JSON!
      ) {
        updateServiceManager(
          organizationId: $organizationId
          campaignId: $campaignId
          serviceManagerName: $serviceManagerName
          updateData: $updateData
        ) {
          id
          name
          data
          fullyConfigured
        }
      }
    `;

    const serviceManagerVariableValues = {
      organizationId,
      serviceManagerName: "per-campaign-messageservices",
      updateData: {
        useOwnMessagingService,
        inventoryPhoneNumberCounts
      },
      campaignId
    };
    const managerResult = await graphql({
      schema,
      source: serviceManagerQuery,
      rootValue,
      contextValue,
      variableValues: serviceManagerVariableValues
    });
    console.log(`managerResult ${JSON.stringify(managerResult)}`);
  }

  return result.data.editCampaign;
}

export async function copyCampaign(campaignId, user) {
  const rootValue = {};
  const source = `
    mutation copyCampaign($campaignId: String!) {
      copyCampaign(id: $campaignId) {
        id
      }
    }
  `;
  const contextValue = getContext({ user });
  return await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues: { campaignId }
  });
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
    throw new Error(`createUsers failed ${JSON.stringify(user)}`);
  }
  const source = `
    mutation joinOrganization($organizationUuid: String!) {
      joinOrganization(organizationUuid: $organizationUuid) {
        id
      }
    }
  `;
  const variableValues = {
    organizationUuid: organization.data.createOrganization.uuid
  };
  const contextValue = getContext({ user });
  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
  if (result.errors) {
    throw new Error(`joinOrganization failed ${JSON.stringify(result)}`);
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
  const source = `
    mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
      editCampaign(id: $campaignId, campaign: $campaign) {
        id
        assignments {
          id
        }
      }
    }
  `;
  const contextValue = getContext({ user: admin });
  const updateCampaign = Object.assign({}, campaign);
  const campaignId = updateCampaign.id;
  updateCampaign.texters = assignments || [
    {
      id: user.id.toString()
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
    source,
    rootValue,
    contextValue,
    variableValues
  });
  if (result.errors) {
    throw new Error(`assignTexter failed ${JSON.stringify(result)}`);
  }
  return result;
}

export async function sendMessage(campaignContactId, user, message) {
  const rootValue = {};
  const source = `
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
    }
  `;
  const contextValue = getContext({ user });
  const variableValues = {
    message,
    campaignContactId
  };
  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
  if (result.errors) {
    console.log(`sendMessage errors ${JSON.stringify(result)}`);
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
    for (let i = 1; i < choices; i += 1) {
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
  const source = `
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

  const contextValue = getContext({ user: admin });
  const campaignId = campaign.id.toString();
  const variableValues = {
    campaignId,
    campaign: {
      interactionSteps: interactionSteps || builtInteractionSteps[0]
    }
  };

  return await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
}

export async function createCannedResponses(admin, campaign, cannedResponses) {
  // cannedResponses: {title, text}
  const rootValue = {};
  const source = `
    mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
      editCampaign(id: $campaignId, campaign: $campaign) {
        id
      }
    }
  `;
  const contextValue = getContext({ user: admin });
  const campaignId = campaign.id;
  const variableValues = {
    campaignId,
    campaign: {
      cannedResponses
    }
  };
  return await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
}

export async function startCampaign(admin, campaign) {
  const rootValue = {};
  const source = `
    mutation startCampaign($campaignId: String!) {
      startCampaign(id: $campaignId) {
        id
      }
    }
  `;
  const contextValue = getContext({ user: admin });
  const variableValues = { campaignId: campaign.id };
  return await graphql({
    schema,
    source,
    rootValue,
    contextValue,
    variableValues
  });
}

export async function getCampaignContact(id) {
  return r
    .knex("campaign_contact")
    .where({ id })
    .first();
}

export async function getOptOut(assignmentId, cell) {
  return r
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
                tags {
                  id
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

  const [res] = await r
    .knex("job_request")
    .returning("id")
    .insert(job);
  job.id = res.id;

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
  for (let i = 0; i < keys.length; i += 1) {
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

export const muiTheme = {
  palette: {
    type: "light",
    background: { paper: "#fff", default: "#fafafa" },
    common: { black: "#000", white: "#fff" },
    error: {
      main: "#f44336",
      light: "rgb(246, 104, 94)",
      dark: "rgb(170, 46, 37)",
      contrastText: "#fff"
    },
    grey: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
      A100: "#d5d5d5",
      A200: "#aaaaaa",
      A400: "#303030",
      A700: "#616161"
    },
    info: {
      main: "#3f80b2",
      light: "rgb(101, 153, 193)",
      dark: "rgb(44, 89, 124)",
      contrastText: "#fff"
    },
    primary: {
      main: "#209556",
      light: "rgb(76, 170, 119)",
      dark: "rgb(22, 104, 60)",
      contrastText: "#fff"
    },
    secondary: {
      main: "#555555",
      light: "rgb(119, 119, 119)",
      dark: "rgb(59, 59, 59)",
      contrastText: "#fff"
    },
    success: {
      main: "#4caf50",
      light: "rgb(111, 191, 115)",
      dark: "rgb(53, 122, 56)",
      contrastText: "rgba(0, 0, 0, 0.87)"
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.54)",
      disabled: "rgba(0, 0, 0, 0.38)",
      hint: "rgba(0, 0, 0, 0.38)"
    },
    warning: {
      main: "#fabe28",
      light: "rgb(251, 203, 83)",
      dark: "rgb(175, 133, 28)",
      contrastText: "rgba(0, 0, 0, 0.87)"
    },
    getContrastText: () => "getContrastText",
    action: {
      hover: "#333333"
    }
  }
};
