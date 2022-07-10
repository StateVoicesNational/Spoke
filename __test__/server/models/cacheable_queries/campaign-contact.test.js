import {
  setupTest,
  cleanupTest,
  createStartedCampaign
} from "../../../test_helpers";
import { r } from "../../../../src/server/models";

const CacheableMessage = require("../../../../src/server/models/cacheable_queries/message");
const saveMessage = CacheableMessage.default.save;

const CacheableCampaignContact = require("../../../../src/server/models/cacheable_queries/campaign-contact");
const lookupByCell = CacheableCampaignContact.default.lookupByCell;

describe("CampaignContactCache", () => {
  let contacts;
  let organization;
  let texter;
  let campaign;

  let service;
  let messageServiceSID;

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  beforeEach(async () => {
    await cleanupTest();
    await setupTest();
    jest.restoreAllMocks();
    const startedCampaign = await createStartedCampaign();
    ({
      testContacts: contacts,
      testOrganization: {
        data: { createOrganization: organization }
      },
      testTexterUser: texter,
      testCampaign: campaign
    } = startedCampaign);

    service = "twilio";
    messageServiceSID = "message_service_sid_vicious";
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  describe("lookupByCell", () => {
    it("finds campaign_contact_id and campaign_id when there is a messageServiceSID", async () => {
      const message = {
        is_from_contact: false,
        contact_number: contacts[0].cell,
        campaign_contact_id: contacts[0].id,
        send_status: "SENT",
        text: "Hey now!",
        service,
        messageservice_sid: messageServiceSID
      };
      await saveMessage({
        messageInstance: message,
        contact: contacts[0],
        organization,
        texter
      });
      const foundMessage = await lookupByCell(
        contacts[0].cell,
        service,
        messageServiceSID
      );
      expect(Number(foundMessage.campaign_id)).toBe(Number(campaign.id));
      expect(Number(foundMessage.campaign_contact_id)).toBe(
        Number(contacts[0].id)
      );
    });
    it("finds campaign_contact_id and campaign_id when there is a userNumber", async () => {
      const message = {
        is_from_contact: false,
        contact_number: contacts[0].cell,
        campaign_contact_id: contacts[0].id,
        send_status: "SENT",
        text: "Hey now!",
        service,
        messageservice_sid: null, // necessary for sqlite tests to pass
        user_number: texter.cell
      };
      await saveMessage({
        messageInstance: message,
        contact: contacts[0],
        organization,
        texter
      });
      const foundMessage = await lookupByCell(
        contacts[0].cell,
        service,
        null, // messageServiceSid
        texter.cell
      );
      expect(Number(foundMessage.campaign_id)).toBe(Number(campaign.id));
      expect(Number(foundMessage.campaign_contact_id)).toBe(
        Number(contacts[0].id)
      );
    });
  });
});
