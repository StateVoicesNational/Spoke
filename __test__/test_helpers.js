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
import loadData from "../src/containers/hoc/load-data";
jest.mock("../src/containers/hoc/load-data");
/* Used to get graphql queries from components.
*  Because of some limitations with the jest require cache that
*  I can't find a way of getting around, it should only be called once
*  per test.

*  The query it returns will be that of the requested component, but
*  the mutations will be merged from the component and its children.
*/
export function getGql(componentPath, props, dataKey = "data") {
  require(componentPath); // eslint-disable-line
  const { mapQueriesToProps } = _.last(loadData.mock.calls)[1];

  const mutations = loadData.mock.calls.reduce((acc, mapping) => {
    if (!mapping[1].mapMutationsToProps) return acc;
    return {
      ...acc,
      ..._.mapValues(
        mapping[1].mapMutationsToProps({ ownProps: props }),
        mutation => (...params) => {
          const m = mutation(...params);
          return [m.mutation.loc.source.body, m.variables];
        }
      )
    };
  }, {});

  let query;
  if (mapQueriesToProps) {
    const data = mapQueriesToProps({ ownProps: props });
    query = [data[dataKey].query.loc.source.body, data[dataKey].variables];
  }

  return { query, mutations };
}

export async function createUser(
  userInfo = {
    auth0_id: "test123",
    first_name: "TestUserFirst",
    last_name: "TestUserLast",
    cell: "555-555-5555",
    email: "testuser@example.com"
  },
  organization_id = null,
  role = null
) {
  const user = new User(userInfo);
  await user.save();
  if (organization_id && role) {
    await r.knex("user_organization").insert({
      user_id: user.id,
      organization_id,
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

export async function runGql(query, vars, user) {
  const rootValue = {};
  const context = getContext({ user });
  return await graphql(mySchema, query, rootValue, context, vars);
}

export async function runComponentGql(componentDataQuery, queryVars, user) {
  return await runGql(componentDataQuery.loc.source.body, queryVars, user);
}

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

export async function createCampaign(
  user,
  organization,
  title = "test campaign"
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
      organizationId
    }
  };
  const ret = await graphql(
    mySchema,
    campaignQuery,
    rootValue,
    context,
    variables
  );
  return ret.data.createCampaign;
}

export async function saveCampaign(user, campaign, title = "test campaign") {
  const rootValue = {};
  const description = "test description";
  const organizationId = campaign.organizationId;
  const context = getContext({ user });

  const campaignQuery = `mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
      title
    }
  }`;

  const variables = {
    campaign: {
      title,
      description,
      organizationId
    },
    campaignId: campaign.id
  };
  const ret = await graphql(
    mySchema,
    campaignQuery,
    rootValue,
    context,
    variables
  );
  return ret.data.editCampaign;
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

export async function createTexter(organization) {
  const rootValue = {};
  const user = await createUser({
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
    organizationUuid: organization.data.createOrganization.uuid
  };
  const context = getContext({ user });
  await graphql(mySchema, joinQuery, rootValue, context, variables);
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
  return await graphql(
    mySchema,
    campaignEditQuery,
    rootValue,
    context,
    variables
  );
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
  const context = getContext({ user: user });
  const variables = {
    message,
    campaignContactId
  };
  return await graphql(mySchema, query, rootValue, context, variables);
}

export async function bulkSendMessages(assignmentId, user) {
  const rootValue = {};
  const query = `
    mutation bulkSendMessage($assignmentId: Int!) {
        bulkSendMessages(assignmentId: $assignmentId) {
          id
        }
      }`;
  const context = getContext({
    user
  });
  const variables = {
    assignmentId
  };
  return await graphql(mySchema, query, rootValue, context, variables);
}

export function buildScript(steps = 2) {
  const createSteps = (step, max) => {
    if (max <= step) {
      return [];
    }
    return [
      {
        id: "new" + step,
        questionText: "hmm" + step,
        script:
          step === 1
            ? "{lastName}"
            : step === 0
            ? "autorespond {zip}"
            : "Step Script " + step,
        answerOption: "hmm" + step,
        answerActions: "",
        parentInteractionId: step > 0 ? "new" + (step - 1) : null,
        isDeleted: false,
        interactionSteps: createSteps(step + 1, max)
      }
    ];
  };
  return createSteps(0, steps);
}

export async function createScript(
  admin,
  campaign,
  interactionSteps,
  steps = 2
) {
  const rootValue = {};
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
    }
  }`;
  // function to create a recursive set of steps of arbitrary depth
  let builtInteractionSteps;

  if (!interactionSteps) {
    builtInteractionSteps = buildScript(steps);
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

  const result = await runGql(conversationsQuery, variables, user);
  return result;
};
