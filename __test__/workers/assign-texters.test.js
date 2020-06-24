import { assignTexters } from "../../src/workers/jobs";
import {
  r,
  Campaign,
  CampaignContact,
  JobRequest,
  Organization,
  User,
  ZipCode
} from "../../src/server/models";
import { setupTest, cleanupTest } from "../test_helpers";

describe("test texter assignment in dynamic mode", () => {
  beforeAll(
    async () => await setupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );
  afterAll(
    async () => await cleanupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );

  const testOrg = new Organization({
    id: "7777777",
    texting_hours_enforced: false,
    texting_hours_start: 9,
    texting_hours_end: 14,
    name: "Test Organization"
  });

  const testCampaign = new Campaign({
    organization_id: testOrg.id,
    id: "7777777",
    use_dynamic_assignment: true
  });

  const texterInfo = [
    {
      id: "1",
      auth0_id: "aaa",
      first_name: "Ruth",
      last_name: "Bader",
      cell: "9999999999",
      email: "rbg@example.com"
    },
    {
      id: "2",
      auth0_id: "bbb",
      first_name: "Elena",
      last_name: "Kagan",
      cell: "8888888888",
      email: "ek@example.com"
    }
  ];

  const contactInfo = [
    "1111111111",
    "2222222222",
    "3333333333",
    "4444444444",
    "5555555555"
  ];

  it("assigns no contacts to texters in dynamic assignment mode", async () => {
    const organization = await Organization.save(testOrg);
    const campaign = await Campaign.save(testCampaign);
    contactInfo.map(contact => {
      CampaignContact.save({ cell: contact, campaign_id: campaign.id });
    });
    texterInfo.map(async texter => {
      await User.save({
        id: texter.id,
        auth0_id: texter.auth0_id,
        first_name: texter.first_name,
        last_name: texter.last_name,
        cell: texter.cell,
        email: texter.email
      });
    });
    const payload =
      '{"id": "3","texters":[{"id":"1","needsMessageCount":5,"maxContacts":"","contactsCount":0},{"id":"2","needsMessageCount":5,"maxContacts":"0","contactsCount":0}]}';
    const job = new JobRequest({
      campaign_id: testCampaign.id,
      payload: payload,
      queue_name: "3:edit_campaign",
      job_type: "assign_texters"
    });
    await assignTexters(job);
    const assignedTextersCount = await r.getCount(
      r
        .knex("campaign_contact")
        .where({ campaign_id: campaign.id })
        .whereNotNull("assignment_id")
    );
    expect(assignedTextersCount).toEqual(0);
  });

  it("supports saving null or zero maxContacts", async () => {
    const zero = await r
      .knex("assignment")
      .where({ campaign_id: testCampaign.id, user_id: 2 })
      .select("max_contacts");
    const blank = await r
      .knex("assignment")
      .where({ campaign_id: testCampaign.id, user_id: 1 })
      .select("max_contacts");
    const maxContactsZero = zero[0]["max_contacts"];
    const maxContactsBlank = blank[0]["max_contacts"];
    expect(maxContactsZero).toEqual(0);
    expect(maxContactsBlank).toEqual(null);
  });

  it("updates max contacts when nothing else changes", async () => {
    const payload =
      '{"id": "3","texters":[{"id":"1","needsMessageCount":0,"maxContacts":"10","contactsCount":0},{"id":"2","needsMessageCount":5,"maxContacts":"15","contactsCount":0}]}';
    const job = new JobRequest({
      campaign_id: testCampaign.id,
      payload: payload,
      queue_name: "4:edit_campaign",
      job_type: "assign_texters"
    });
    await assignTexters(job);
    const ten = await r
      .knex("assignment")
      .where({ campaign_id: testCampaign.id, user_id: "1" })
      .select("max_contacts");
    const fifteen = await r
      .knex("assignment")
      .where({ campaign_id: testCampaign.id, user_id: "2" })
      .select("max_contacts");
    const maxContactsTen = ten[0]["max_contacts"];
    const maxContactsFifteen = fifteen[0]["max_contacts"];
    expect(maxContactsTen).toEqual(10);
    expect(maxContactsFifteen).toEqual(15);
  });
});

// TODO: test in standard assignment mode
