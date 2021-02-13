import orgCache from "../../../../src/server/models/cacheable_queries/organization";

describe("cacheable_queries.organization", () => {
  let twilioOrganization;
  let fakeServiceOrganization;
  beforeEach(async () => {
    twilioOrganization = {
      features: {
        service: "twilio",
        TWILIO_AUTH_TOKEN: "fake_twilio_auth_token",
        TWILIO_ACCOUNT_SID: "fake_twilio_auth_account_sid",
        TWILIO_MESSAGE_SERVICE_SID: "fake_twilio_message_service_sid"
      }
    };
    fakeServiceOrganization = {
      features: {
        service: "fakeservice"
      }
    };
  });

  describe("getMessageServiceConfig", () => {
    describe("when the message service has getConfigFromCache", () => {
      it("returns a config", async () => {
        const allegedConfig = await orgCache.getMessageServiceConfig(
          twilioOrganization
        );
        expect(allegedConfig).toEqual({
          authToken: twilioOrganization.features.TWILIO_AUTH_TOKEN,
          accountSid: twilioOrganization.features.TWILIO_ACCOUNT_SID,
          messageServiceSid:
            twilioOrganization.features.TWILIO_MESSAGE_SERVICE_SID
        });
      });
    });
    describe("when the message service doesn't have getConfigFromCache", () => {
      it("does not return a config", async () => {
        const allegedConfig = await orgCache.getMessageServiceConfig(
          fakeServiceOrganization
        );
        expect(allegedConfig).toBeNull();
      });
    });
  });

  describe("getMessageServiceSid", () => {
    describe("when the message service has getConfigFromCache", () => {
      it("returns a config", async () => {
        const allegedMessageServiceSid = await orgCache.getMessageServiceSid(
          twilioOrganization
        );
        expect(allegedMessageServiceSid).toEqual(
          twilioOrganization.features.TWILIO_MESSAGE_SERVICE_SID
        );
      });
    });
    describe("when the message service doesn't have getConfigFromCache", () => {
      it("does not return a config", async () => {
        const allegedConfig = await orgCache.getMessageServiceSid(
          fakeServiceOrganization
        );
        expect(allegedConfig).toBeNull();
      });
    });
  });
});
