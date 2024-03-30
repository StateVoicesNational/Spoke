import { postMessageSave } from "../../../src/extensions/message-handlers/auto-optout";
import { cacheableData, r } from "../../../src/server/models";

import {
  setupTest,
  cleanupTest,
  createStartedCampaign
} from "../../test_helpers";

const sendMessage = require("../../../src/server/api/mutations/sendMessage");

const CacheableMessage = require("../../../src/server/models/cacheable_queries/message");
const saveMessage = CacheableMessage.default.save;

const AutoOptout = require("../../../src/extensions/message-handlers/auto-optout");

describe("Auto Opt-Out Tests", () => {
  let message;

  beforeEach(() => {
    jest.resetAllMocks();

    global.SEND_AUTO_OPT_OUT_RESPONSE = false;
    global.DEFAULT_SERVICE = "fakeservice";

    jest.spyOn(cacheableData.optOut, "save").mockResolvedValue(null);
    jest.spyOn(cacheableData.campaignContact, "load").mockResolvedValue({
      id: 1,
      assignment_id: 2
    });
    jest.spyOn(sendMessage, "sendRawMessage").mockResolvedValue(null);

    message = {
      is_from_contact: true,
      contact_number: "+123456",
      campaign_contact_id: 1,
      text: "please stop"
    };
  });

  afterEach(() => {
    global.SEND_AUTO_OPT_OUT_RESPONSE = false;
    global.DEFAULT_SERVICE = "fakeservice";
  });

  it("Does not send message without env variable", async () => {
    await postMessageSave({
      message,
      organization: { id: 1 },
      handlerContext: { autoOptOutReason: "stop" }
    });

    expect(cacheableData.optOut.save).toHaveBeenCalled();
    expect(cacheableData.campaignContact.load).toHaveBeenCalled();

    expect(sendMessage.sendRawMessage).not.toHaveBeenCalled();
  });

  it("Sends message with env variable", async () => {
    global.SEND_AUTO_OPT_OUT_RESPONSE = true;

    await postMessageSave({
      message,
      organization: { id: 1 },
      handlerContext: { autoOptOutReason: "stop" }
    });

    expect(cacheableData.optOut.save).toHaveBeenCalled();
    expect(cacheableData.campaignContact.load).toHaveBeenCalled();

    expect(sendMessage.sendRawMessage).toHaveBeenCalled();
  });

  it("Does not send with twilio opt-out words", async () => {
    global.SEND_AUTO_OPT_OUT_RESPONSE = true;
    global.DEFAULT_SERVICE = "twilio";

    message.text = "      stopall ";

    await postMessageSave({
      message,
      organization: { id: 1 },
      handlerContext: { autoOptOutReason: "stop" }
    });

    expect(cacheableData.optOut.save).toHaveBeenCalled();
    expect(cacheableData.campaignContact.load).toHaveBeenCalled();

    expect(sendMessage.sendRawMessage).not.toHaveBeenCalled();
  });
});

describe("Tests for Auto Opt-Out's members getting called from messageCache.save", () => {
  let contacts;
  let organization;
  let texter;

  let service;
  let messageServiceSID;

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.FLUSHDB();
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
      testTexterUser: texter
    } = startedCampaign);

    service = "twilio";
    messageServiceSID = "message_service_sid_vicious";

    const messageToContact = {
      is_from_contact: false,
      contact_number: contacts[0].cell,
      campaign_contact_id: contacts[0].id,
      send_status: "SENT",
      text: "Hey now!",
      service,
      messageservice_sid: messageServiceSID
    };
    await saveMessage({
      messageInstance: messageToContact,
      contact: contacts[0],
      organization,
      texter
    });
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("gets called", async () => {
    const message = {
      is_from_contact: true,
      contact_number: contacts[0].cell,
      service,
      messageservice_sid: messageServiceSID,
      text: "stop2quit",
      send_status: "DELIVERED"
    };

    jest.spyOn(AutoOptout, "preMessageSave").mockResolvedValue(null);
    jest.spyOn(AutoOptout, "postMessageSave").mockResolvedValue(null);

    await saveMessage({
      messageInstance: message
    });

    expect(AutoOptout.preMessageSave).toHaveBeenCalledWith(
      expect.objectContaining({
        messageToSave: expect.objectContaining({
          text: "stop2quit",
          contact_number: contacts[0].cell
        })
      })
    );

    expect(AutoOptout.postMessageSave).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          text: "stop2quit",
          contact_number: contacts[0].cell
        })
      })
    );
  });
});
