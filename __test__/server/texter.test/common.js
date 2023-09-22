import { r } from "../../../src/server/models";
import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  createContacts,
  createTexter,
  assignTexter,
  createScript,
  startCampaign,
  getCampaignContact
} from "../../test_helpers";

let testAdminUser;
let testInvite;
let testOrganization;
let testCampaign;
let testTexterUser;
let testTexterUser2;
let testContacts;
let testContact;
let assignmentId;

beforeEach(async () => {
  // Set up an entire working campaign
  await setupTest();
  testAdminUser = await createUser();
  testInvite = await createInvite();
  testOrganization = await createOrganization(testAdminUser, testInvite);
  testCampaign = await createCampaign(testAdminUser, testOrganization);
  testContacts = await createContacts(testCampaign, 100);
  testContact = testContacts[0];
  testTexterUser = await createTexter(testOrganization);
  testTexterUser2 = await createTexter(testOrganization);

  await assignTexter(testAdminUser, testTexterUser, testCampaign);

  const dbCampaignContact = await getCampaignContact(testContact.id);
  assignmentId = dbCampaignContact.assignment_id;
  await createScript(testAdminUser, testCampaign);
  await startCampaign(testAdminUser, testCampaign);
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

afterEach(async () => {
  await cleanupTest();
  if (r.redis) r.redis.flushdb();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

export {
  testAdminUser,
  testInvite,
  testOrganization,
  testCampaign,
  testTexterUser,
  testTexterUser2,
  testContacts,
  testContact,
  assignmentId
};
