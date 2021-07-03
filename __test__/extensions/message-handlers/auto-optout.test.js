import { postMessageSave } from "../../../src/extensions/message-handlers/auto-optout";
import { cacheableData } from "../../../src/server/models";
const mutations = require("../../../src/server/api/mutations");

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
    jest.spyOn(mutations, "sendRawMessage").mockResolvedValue(null);

    message = {
      is_from_contact: true,
      contact_number: "+123456",
      campaign_contact_id: 1,
      text: 'please stop'
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

    expect(mutations.sendRawMessage).not.toHaveBeenCalled();
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

    expect(mutations.sendRawMessage).toHaveBeenCalled();
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

    expect(mutations.sendRawMessage).not.toHaveBeenCalled();
  });
})