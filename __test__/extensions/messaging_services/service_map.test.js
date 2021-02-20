import * as serviceMap from "../../../src/extensions/messaging_services/service_map";

describe("service_map", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe("tests with mocked service map", () => {
    let serviceWith;
    let serviceWithout;
    let fakeServiceMap;
    beforeEach(async () => {
      serviceWith = {
        getServiceConfig: jest.fn().mockImplementation(() => "fake_config"),
        getMessageServiceSid: jest.fn()
      };

      serviceWithout = {};

      fakeServiceMap = { serviceWith, serviceWithout };

      jest
        .spyOn(serviceMap, "getService")
        .mockImplementation(serviceName => fakeServiceMap[serviceName]);
    });

    describe("getConfigKey", () => {
      it("returns the correct config key", async () => {
        const configKey = serviceMap.getConfigKey("fake_service_name");
        expect(configKey).toEqual("message_service_fake_service_name");
      });
    });

    describe("tryGetFunctionFromService", () => {
      it("returns the function", async () => {
        const fn = serviceMap.tryGetFunctionFromService(
          "serviceWith",
          "getServiceConfig"
        );
        expect(fn).not.toBeNull();
        expect(typeof fn).toEqual("function");
        const fnReturn = fn();
        expect(fnReturn).toEqual("fake_config");
      });
      describe("when the service doesn't exist", () => {
        it("throws an exception", async () => {
          let error;
          try {
            serviceMap.tryGetFunctionFromService(
              "not_a_service",
              "getServiceConfig"
            );
          } catch (caught) {
            error = caught;
          }
          expect(error).toBeDefined();
          expect(error.message).toEqual(
            "not_a_service is not a message service"
          );
        });
      });
      describe("when the service doesn't have the function", () => {
        it("returns null", async () => {
          const fn = serviceMap.tryGetFunctionFromService(
            "serviceWithout",
            "getServiceConfig"
          );
          expect(fn).toBeNull();
        });
      });
    });
  });

  describe("getServiceMetadata", () => {
    describe("service doesn't have the function", () => {
      beforeEach(() => {
        jest
          .spyOn(serviceMap, "tryGetFunctionFromService")
          .mockReturnValue(null);
      });
      it("throws an exception", async () => {
        let error;
        try {
          serviceMap.getServiceMetadata("incomplete_service");
        } catch (caught) {
          error = caught;
        }
        expect(serviceMap.tryGetFunctionFromService.mock.calls).toEqual([
          ["incomplete_service", "getMetadata"]
        ]);
        expect(error.message).toEqual(
          "Message service incomplete_service is missing required method getMetadata!"
        );
      });
    });
    describe("twilio", () => {
      it("returns the metadata", () => {
        const metadata = serviceMap.getServiceMetadata("twilio");
        expect(metadata).toEqual({
          name: "twilio",
          supportsCampaignConfig: false,
          supportsOrgConfig: true,
          type: "SMS"
        });
      });
    });
    describe("nexo", () => {
      it("returns the metadata", () => {
        const metadata = serviceMap.getServiceMetadata("nexmo");
        expect(metadata).toEqual({
          name: "nexmo",
          supportsCampaignConfig: false,
          supportsOrgConfig: false,
          type: "SMS"
        });
      });
    });
    describe("fakeservice", () => {
      it("returns the metadata", () => {
        const metadata = serviceMap.getServiceMetadata("fakeservice");
        expect(metadata).toEqual({
          name: "fakeservice",
          supportsCampaignConfig: false,
          supportsOrgConfig: false,
          type: "SMS"
        });
      });
    });
  });
});
