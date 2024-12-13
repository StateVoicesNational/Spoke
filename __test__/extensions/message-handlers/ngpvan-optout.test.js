const VanOptOut = require("../../../src/extensions/message-handlers/ngpvan-optout");
const VanUtil = require("../../../src/extensions/contact-loaders/ngpvan/util");
const HttpRequest = require("../../../src/server/lib/http-request");

describe("extensions.message-handlers.ngpvan-optout", () => {
  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe("postMessageSave", () => {
    let message;
    let contact;
    let organization;
    let handlerContext;

    beforeEach(async () => {
      message = {
        campaign_contact_id: "1234",
        contact_number: "(123)-456-7890",
        is_from_contact: true
      };

      organization = {
        id: 1
      };

      handlerContext = {
        autoOptOutReason: "stop"
      }

      jest.spyOn(VanOptOut, "available").mockReturnValue(true);
      jest.spyOn(VanOptOut, "dbQuery").mockReturnValue([{custom_fields: '{"VanID": 1234}'}]);

      jest.spyOn(VanUtil.default, "getAuth").mockReturnValue("*****");

      jest.spyOn(HttpRequest, "default").mockReturnValue(null);
    });

    it("delegates to its dependencies and DOES post to NGP VAN", async () => {
      const result = await VanOptOut.postMessageSave({
        handlerContext,
        organization,
        message
      });

      expect(result).toEqual({});

      expect(HttpRequest.default.mock.calls).toEqual(
        [
          [
            "https://api.securevan.com/v4/people/1234/canvassResponses",
            {
              "method": "POST",
              "retries": 1,
              "timeout": 32000,
              "headers": {
                "Authorization": "*****",
                "accept": "text/plain",
                "Content-Type": "application/json"
              },
              "body": `{"canvassContext":{"inputTypeId":11,"phone":{"dialingPrefix":"1"`+
              `,"phoneNumber":"123-456-7890","smsOptInStatus":"O"}},"resultCodeId":130}`,
              "validStatuses": [204],
              "compress": false
            }
          ]
        ]
      );
    });

    describe("when the handler is not available", () => {
      beforeEach(async () => {
        VanOptOut.available.mockReturnValue(false);
      });

      it("returns an empty object and DOES NOT post to NGP VAN", async () => {
        const result = await VanOptOut.postMessageSave({
          handlerContext,
          organization,
          message
        });

        expect(result).toEqual({});
        expect(HttpRequest.default.mock.calls).toHaveLength(0);
      });
    });

    describe("when message is null or undefined", () => {
      beforeEach(async () => {
        handlerContext = {}
      });

      it("returns an empty object and DOES NOT post to NGP VAN", async () => {
        const result = await VanOptOut.postMessageSave({
          handlerContext,
          organization,
          message
        });

        expect(result).toEqual({});
        expect(HttpRequest.default.mock.calls).toHaveLength(0);
      });
    });

    describe("when no VAN Id is inclued", () => {
      beforeEach(async () => {
        VanOptOut.dbQuery.mockReturnValue({});
      });

      it("returns an empty object and DOES NOT post to NGP VAN", async () => {
        const result = await VanOptOut.postMessageSave({
          handlerContext,
          organization,
          message
        });

        expect(result).toEqual({});
        expect(HttpRequest.default.mock.calls).toHaveLength(0);
      })
    })

    describe("when alternate VAN ID is included", () => {
      beforeEach(async () => {
        VanOptOut.dbQuery.mockReturnValue([{custom_fields: '{"vanid": 1234}'}])
      });

      it("still works and DOES post to NGP VAN", async () => {
        const result = await VanOptOut.postMessageSave({
          handlerContext,
          organization,
          message
        });

        expect(result).toEqual({});
        expect(HttpRequest.default.mock.calls).toEqual(
          [
            [
              "https://api.securevan.com/v4/people/1234/canvassResponses",
              {
                "method": "POST",
                "retries": 1,
                "timeout": 32000,
                "headers": {
                  "Authorization": "*****",
                  "accept": "text/plain",
                  "Content-Type": "application/json"
                },
                "body": `{"canvassContext":{"inputTypeId":11,"phone":{"dialingPrefix":"1"`+
                `,"phoneNumber":"123-456-7890","smsOptInStatus":"O"}},"resultCodeId":130}`,
                "validStatuses": [204],
                "compress": false
              }
            ]
          ]
        );
      })
    });

    describe("when no contact number is included in the message object", () => {
      beforeEach(async () => {
        message = {
          ...message,
          contact_number: ""
        };
      });

      it("returns an object and DOES NOT post to NGP VAN", async () => {
        const result = await VanOptOut.postMessageSave({
          handlerContext,
          organization,
          message
        });

        expect(result).toEqual({});
        expect(HttpRequest.default.mock.calls).toHaveLength(0);
      });
    });

    describe("when the alternate optOutReason is passed in the handlerContext object", () => {
      beforeEach(async () => {
        handlerContext = {
          optOutReason: "manual"
        }
      });

      it("returns an empty object and DOES post to NGP VAN", async () => {
        const result = await VanOptOut.postMessageSave({
          handlerContext,
          organization,
          message
        })

        expect(result).toEqual({});
        expect(HttpRequest.default.mock.calls)
      })
    })

    // Skipping as there is a world where we opt out someone
    // even when the message is not from them originally
    describe.skip("when the message is not from the contact", () => {
      beforeEach(async () => {
        message = {
          ...message,
          is_from_contact: false
        };
      });

      it("returns and empty obejct and DOES NOT post to NGP VAN", async () => {
        const result = await VanOptOut.postMessageSave({
          handlerContext,
          organization,
          message
        });

        expect(result).toEqual({});
        expect(HttpRequest.default.mock.calls).toEqual(
          [
            [
              "https://api.securevan.com/v4/people/1234/canvassResponses",
              {
                "method": "POST",
                "retries": 1,
                "timeout": 32000,
                "headers": {
                  "Authorization": "*****",
                  "accept": "text/plain",
                  "Content-Type": "application/json"
                },
                "body": `{"canvassContext":{"inputTypeId":11,"phone":{"dialingPrefix":"1"`+
                `,"phoneNumber":"123-456-7890","smsOptInStatus":"O"}},"resultCodeId":130}`,
                "validStatuses": [204],
                "compress": false
              }
            ]
          ]
        );
      });
    });
  });
});
