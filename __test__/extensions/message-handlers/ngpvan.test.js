const Config = require("../../../src/server/api/lib/config");
const Van = require("../../../src/extensions/message-handlers/ngpvan");
const VanAction = require("../../../src/extensions/action-handlers/ngpvan-action");
const ActionHandlers = require("../../../src/extensions/action-handlers");

describe("extensions.message-handlers.ngpvan", () => {
  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe("postMessageSave", () => {
    let message;
    let contact;
    let organization;

    beforeEach(async () => {
      message = {
        is_from_contact: false
      };

      contact = {
        message_status: "needsMessage"
      };

      organization = {
        id: 1
      };

      jest.spyOn(Config, "getConfig").mockReturnValue(undefined);
      jest.spyOn(Van, "available").mockReturnValue(true);
      jest.spyOn(ActionHandlers, "getActionChoiceData").mockResolvedValue([
        {
          name: "Texted",
          details: JSON.stringify({ data: "fake_data" })
        }
      ]);

      jest.spyOn(VanAction, "postCanvassResponse").mockResolvedValue(null);
    });

    it("delegates to its dependencies", async () => {
      const result = await Van.postMessageSave({
        message,
        contact,
        organization
      });

      expect(result).toEqual({});

      expect(ActionHandlers.getActionChoiceData.mock.calls).toEqual([
        [VanAction, organization]
      ]);

      expect(Config.getConfig.mock.calls).toEqual([
        ["NGP_VAN_INITIAL_TEXT_CANVASS_RESULT", organization]
      ]);

      expect(VanAction.postCanvassResponse.mock.calls).toEqual([
        [
          contact,
          organization,
          {
            data: "fake_data"
          }
        ]
      ]);
    });

    describe.only("when NGP_VAN_INITIAL_TEXT_CANVASS_RESULT is not found in the actions", () => {
      beforeEach(async () => {
        ActionHandlers.getActionChoiceData.mockRestore();
        jest.spyOn(ActionHandlers, "getActionChoiceData").mockResolvedValue([]);
        jest.spyOn(console, "error");
      });

      it("Does not call Van.postCanvassResponse and logs an error", async () => {
        await Van.postMessageSave({
          message,
          contact,
          organization
        });

        // eslint-disable-next-line no-console
        expect(console.error.mock.calls).toEqual([
          [
            "NGPVAN message handler -- not handling message because no action choice data found for Texted"
          ]
        ]);
        expect(VanAction.postCanvassResponse).not.toHaveBeenCalled();
      });
    });

    describe("when the handler is not available", () => {
      beforeEach(async () => {
        Van.available.mockReturnValue(false);
      });

      it("returns an empty object and doesn't call getActionChoiceData", async () => {
        const result = await Van.postMessageSave({
          message,
          contact,
          organization
        });
        expect(result).toEqual({});
        expect(ActionHandlers.getActionChoiceData).not.toHaveBeenCalled();
      });
    });

    describe("when the message is from a contact", () => {
      beforeEach(async () => {
        message.is_from_contact = true;
      });

      it("returns an empty object and doesn't call getActionChoiceData", async () => {
        const result = await Van.postMessageSave({
          message,
          contact,
          organization
        });
        expect(result).toEqual({});
        expect(ActionHandlers.getActionChoiceData).not.toHaveBeenCalled();
      });
    });

    describe("when contact is null or undefined", () => {
      it("returns an empty object and doesn't call getActionChoiceData", async () => {
        const result = await Van.postMessageSave({
          message,
          organization
        });
        expect(result).toEqual({});
        expect(ActionHandlers.getActionChoiceData).not.toHaveBeenCalled();
      });
    });

    describe("when this is not the first message to the contact", () => {
      beforeEach(async () => {
        contact.message_status = "messaged";
      });

      it("returns an empty object and doesn't call getActionChoiceData", async () => {
        const result = await Van.postMessageSave({
          message,
          contact,
          organization
        });
        expect(result).toEqual({});
        expect(ActionHandlers.getActionChoiceData).not.toHaveBeenCalled();
      });
    });
  });

  //
});
