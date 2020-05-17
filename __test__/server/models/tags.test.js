import {
  setupTest,
  cleanupTest,
  createUser as helperCreateUser,
  createInvite as helperCreateInvite,
  createOrganization as helperCreateOrganization,
  createCampaign,
  createContacts
} from "../../test_helpers";
import { r, Tag, TagCampaignContact } from "../../../src/server/models";

describe("A tag model", () => {
  let userTest;
  let inviteTest;
  let organizationTest;
  let campaignTest;
  let contactTest;
  let contactTestTwo;
  let tagFields;
  let campaignContactFromDB;
  beforeEach(async () => {
    await setupTest();

    // Creating the instances needed to create a new tag and update its content
    userTest = await helperCreateUser();
    inviteTest = await helperCreateInvite();
    organizationTest = await helperCreateOrganization(userTest, inviteTest);
    campaignTest = await createCampaign(userTest, organizationTest);
    [contactTest, contactTestTwo] = await createContacts(campaignTest, 2);

    // createContacts feeds the campaign_contact table, so we can use it from the db to create the tag content
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
      // get it from db
      const querySecondContact = await r.knex("campaign_contact").where({
        campaign_id: Number(contactTestTwo.campaign_id),
        first_name: contactTestTwo.first_name,
        last_name: contactTestTwo.last_name
      });
      // ...and aply the same tag applied to another contact
      const newTagCampaignContact = {
        value: "Tagged a different contact",
        tag_id: tagTest.id,
        campaign_contact_id: querySecondContact[0].id
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
