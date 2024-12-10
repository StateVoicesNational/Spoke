const Config = require("../../../src/server/api/lib/config");
const Van = require("../../../src/extensions/message-handlers/ngpvan-optout");
const VanAction = require("../../../src/extensions/action-handlers/ngpvan-action");

describe("extensions.message-handlers.ngpvan-optout", () => {
  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe("postMessageSave", () => {
    let message;
    let contact;
    let organization;
    let handlerContext;
    let body;

    beforeEach(async () => {
      message = {
        is_from_contact: false
      };

      contact = {
        message_status: "needsMessage",
        custom_fields: '{"vanid": 12345}',
        cell: "123-456-7891"
      };

      organization = {
        id: 1
      };

      handlerContext = {
        autoOptOutReason: "stop"
      }

      // Custom body for this call - this is the expected structure
      body = {
        "canvassContext": {
            "inputTypeId": 11, // API input
            "phone": {
                "dialingPrefix": "1",
                "phoneNumber": "123-456-7891",
                "smsOptInStatus": "O" // opt out status
            }
        },
        "resultCodeId": 130
    };

      jest.spyOn(Config, "getConfig").mockReturnValue(undefined);
      jest.spyOn(Van, "available").mockReturnValue(true);

      jest.spyOn(VanAction, "postCanvassResponse").mockResolvedValue(null);
    });

    it("delegates to its dependencies and DOES call postCanvassResponse", async () => {
      const result = await Van.postMessageSave({
        contact,
        handlerContext,
        organization
      });

      expect(result).toEqual({});

      // This also verifies that postCanvassResponse was only called once
      expect(VanAction.postCanvassResponse.mock.calls).toEqual([
        [
          contact,
          organization,
          body
        ]
      ]);
    });

    describe("when the handler is not available", () => {
      beforeEach(async () => {
        Van.available.mockReturnValue(false);
      });

      it("returns an empty object and DOES NOT call postCanvassResponse", async () => {
        const result = await Van.postMessageSave({
          message,
          contact,
          organization
        });
        expect(result).toEqual({});
        expect(VanAction.postCanvassResponse.mock.calls).toHaveLength(0);
      });
    });

    describe("when contact is null or undefined", () => {
      it("returns an empty object and DOES NOT call postCanvassResponse", async () => {
        const result = await Van.postMessageSave({
          message,
          organization
        });
        expect(result).toEqual({});
        expect(VanAction.postCanvassResponse.mock.calls).toHaveLength(0);
      });
    });

    describe("when no VAN Id is inclued", () => {
      beforeEach(async () => {
        contact = {
          ...contact,
          custom_fields: '{}'
        };
      });

      it("returns an empty object and DOES NOT call postCanvassResponse", async () => {
        const result = await Van.postMessageSave({
          message,
          contact,
          organization,
          handlerContext
        });

        expect(result).toEqual({});
        expect(VanAction.postCanvassResponse.mock.calls).toHaveLength(0);
      })
    })

    describe("when alternate VAN ID is included", () => {
      beforeEach(async () => {
        contact = {
          ...contact,
          customFields: '{"VanID": 54321}'
        };
      });

      it("still works and DOES call postCanvassResponse", async () => {
        const result = await Van.postMessageSave({
          message,
          contact,
          organization,
          handlerContext
        });

        expect(result).toEqual({});
        expect(VanAction.postCanvassResponse.mock.calls).toHaveLength(1);
      })
    })
  });
});
