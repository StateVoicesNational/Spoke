/**
r* @jest-environment jsdom
 */
import {
  cleanupTest,
  createStartedCampaign,
  setupTest,
  makeRunnableMutations
} from "../../test_helpers";

import { r } from "../../../src/server/models";

import { operations as assignmentTexterOps } from "../../../src/containers/AssignmentTexterContact";

const ComplexTestActionHandler = require("../../../src/integrations/action-handlers/complex-test-action");

describe("mutations.updateContactTags", () => {
  let campaign;
  let texterUser;
  let contacts;
  let organization;
  let tags;
  let dbExpectedTags;
  let gqlExpectedTags;
  let wrappedMutations;

  beforeEach(async () => {
    await cleanupTest();
    await setupTest();
    jest.restoreAllMocks();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  beforeEach(async () => {
    const startedCampaign = await createStartedCampaign();

    ({
      testOrganization: {
        data: { createOrganization: organization }
      },
      testCampaign: campaign,
      testTexterUser: texterUser,
      testContacts: contacts
    } = startedCampaign);

    tags = [
      {
        id: 1,
        name: "HELP!",
        description: "Need help",
        organization_id: organization.id
      },
      {
        id: 2,
        name: "SUPPRESSION",
        description: "Reporting voter suppression",
        organization_id: organization.id
      },
      {
        id: 3,
        name: "VOLUNTEER",
        description: "Commits to volunteer",
        organization_id: organization.id
      },
      {
        id: 4,
        name: "MEGADONOR",
        description: "Sending a wire transfer",
        organization_id: organization.id
      }
    ];

    await r.knex("tag").insert(tags);

    dbExpectedTags = tags.map(({ id, name, organization_id }) => ({
      id: id.toString(),
      organizationId: organization_id,
      name
    }));

    gqlExpectedTags = tags.map(({ id, name, organization_id }) => ({
      id: id.toString(),
      organizationId: organization_id,
      name
    }));
  });

  beforeEach(async () => {
    wrappedMutations = makeRunnableMutations(
      assignmentTexterOps.mutations,
      texterUser
    );
  });

  it("saves the tags", async () => {
    const result = await wrappedMutations.updateContactTags(
      dbExpectedTags,
      contacts[0].id
    );

    expect(result.data.updateContactTags).toEqual(contacts[0].id.toString());

    const tagged = await r.knex("tag_campaign_contact");

    expect(tagged).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag_id: tags[0].id,
          value: null,
          campaign_contact_id: contacts[0].id
        }),
        expect.objectContaining({
          tag_id: tags[1].id,
          value: null,
          campaign_contact_id: contacts[0].id
        }),
        expect.objectContaining({
          tag_id: tags[2].id,
          value: null,
          campaign_contact_id: contacts[0].id
        }),
        expect.objectContaining({
          tag_id: tags[3].id,
          value: null,
          campaign_contact_id: contacts[0].id
        })
      ])
    );
  });

  // TODO: implement these tests when we add a tag handler
  it.skip("calls tag handlers", () => {});
  it.skip("doesn't fail when dispatching to tag handlers throws an exception", () => {});

  describe("when cacheableData.tagCampaignContact.save throws an exception", () => {
    it("eats the exception and logs it", async () => {
      jest.spyOn(console, "error");

      const result = await wrappedMutations.updateContactTags(
        dbExpectedTags,
        999999 // this will cause cacheableData.campaignContact.load to throw an exception
      );

      expect(result.errors[0].message).toEqual(
        expect.stringMatching(/^Cannot convert `undefined`.*/)
      );

      expect(console.error).toHaveBeenCalledTimes(1); // eslint-disable-line no-console
      // eslint-disable-next-line no-console
      expect(console.error.mock.calls[0][0]).toEqual(
        expect.stringMatching(
          /^Error saving tagCampaignContact for campaignContactID 999999.*/
        )
      );
    });
  });
});
