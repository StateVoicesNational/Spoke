import {
  createStartedCampaign,
  setupTest,
  cleanupTest
} from "../../../test_helpers";
import { r, cacheableData } from "../../../../src/server/models";
import * as TagCampaignContact from "../../../../src/server/models/cacheable_queries/tag-campaign-contact";

describe("cacheable_queries.tagCampaignContactCache", () => {
  let initData;
  let tags;
  let organization;
  let contacts;
  let contactCacheEnabled;
  let numberOfExpectedCalls;

  const makeLoadToCacheCallsExpectation = (
    numberOfCalls,
    campaignContactId
  ) => {
    return Array(numberOfCalls).fill([campaignContactId]);
  };

  beforeEach(async () => {
    await setupTest();
    initData = await createStartedCampaign();

    ({
      testOrganization: {
        data: { createOrganization: organization }
      },
      testContacts: contacts
    } = initData);

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

    jest.spyOn(TagCampaignContact, "loadToCache");

    contactCacheEnabled =
      process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;
    numberOfExpectedCalls = r.redis && contactCacheEnabled ? 0 : 1;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanupTest();
    if (r.redis) {
      r.redis.flushdb();
    }
  });

  describe(".save", () => {
    beforeEach(async () => {});

    it("saves the tags", async () => {
      await cacheableData.tagCampaignContact.save(contacts[0].id, [
        {
          id: 2,
          value: "Everyone votes!"
        },
        {
          id: 1
        }
      ]);

      expect(TagCampaignContact.loadToCache.mock.calls).toEqual([
        [contacts[0].id]
      ]);

      const tagCampaignContacts = await r.knex("tag_campaign_contact").select();

      expect(tagCampaignContacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tag_id: 1,
            value: null,
            campaign_contact_id: 1
          }),
          expect.objectContaining({
            tag_id: 2,
            value: "Everyone votes!",
            campaign_contact_id: 1
          })
        ])
      );
    });
  });

  describe(".query", () => {
    let expectedQueryReturn;

    beforeEach(async () => {
      await cacheableData.tagCampaignContact.save(contacts[0].id, [
        {
          id: 2,
          value: "Everyone votes!"
        },
        {
          id: 1
        }
      ]);

      expectedQueryReturn = expect.arrayContaining([
        {
          id: 1,
          value: null,
          campaign_contact_id: 1
        },
        {
          id: 2,
          value: "Everyone votes!",
          campaign_contact_id: 1
        }
      ]);

      TagCampaignContact.loadToCache.mockClear();
    });

    it("returns the tags for the campaign contact", async () => {
      let contactTags = await cacheableData.tagCampaignContact.query({
        campaignContactId: contacts[0].id,
        minimalObj: true
      });

      expect(TagCampaignContact.loadToCache.mock.calls).toEqual(
        makeLoadToCacheCallsExpectation(numberOfExpectedCalls, contacts[0].id)
      );

      expect(contactTags).toHaveLength(2);
      expect(contactTags).toEqual(expectedQueryReturn);

      contactTags = await cacheableData.tagCampaignContact.query({
        campaignContactId: contacts[0].id,
        minimalObj: true
      });

      expect(TagCampaignContact.loadToCache.mock.calls).toEqual(
        makeLoadToCacheCallsExpectation(
          numberOfExpectedCalls * 2,
          contacts[0].id
        )
      );
    });

    describe("when a tag value is updated", () => {
      beforeEach(async () => {
        expectedQueryReturn = expect.arrayContaining([
          {
            id: 1,
            value: "4th of July, Asbury Park",
            campaign_contact_id: 1
          },
          {
            id: 2,
            value: "Everyone votes!",
            campaign_contact_id: 1
          }
        ]);
      });

      it("updates the value and does not save another instance of the tag", async () => {
        await cacheableData.tagCampaignContact.save(contacts[0].id, [
          {
            id: 1,
            value: "4th of July, Asbury Park"
          }
        ]);

        const tagCampaignContacts = await r
          .knex("tag_campaign_contact")
          .select();

        expect(tagCampaignContacts).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              tag_id: 1,
              value: "4th of July, Asbury Park",
              campaign_contact_id: 1
            }),
            expect.objectContaining({
              tag_id: 2,
              value: "Everyone votes!",
              campaign_contact_id: 1
            })
          ])
        );

        const contactTags = await cacheableData.tagCampaignContact.query({
          campaignContactId: contacts[0].id,
          minimalObj: true
        });
        expect(contactTags).toHaveLength(2);
        expect(contactTags).toEqual(expectedQueryReturn);
      });
    });

    describe("when the contact has no tags", () => {
      it("", async () => {
        const contactTags = await cacheableData.tagCampaignContact.query({
          campaignContactId: 9999999,
          minimalObj: true
        });

        expect(contactTags).toEqual([]);
      });
    });

    describe("when one of the tags is resolved", () => {
      beforeEach(async () => {
        await cacheableData.tagCampaignContact.save(contacts[0].id, [
          {
            id: 3,
            value: "RESOLVED"
          }
        ]);

        TagCampaignContact.loadToCache.mockClear();
      });

      it("doesn't return it", async () => {
        const contactTags = await cacheableData.tagCampaignContact.query({
          campaignContactId: contacts[0].id,
          minimalObj: true
        });

        expect(TagCampaignContact.loadToCache.mock.calls).toEqual(
          makeLoadToCacheCallsExpectation(numberOfExpectedCalls, contacts[0].id)
        );
        expect(contactTags).toHaveLength(2);
        expect(contactTags).toEqual(expectedQueryReturn);
      });
    });
  });
});
