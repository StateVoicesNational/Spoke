import * as serviceMap from "../../../src/extensions/messaging_services/service_map";
import * as config from "../../../src/server/api/lib/config";

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

    describe("#getConfigKey", () => {
      it("returns the correct config key", async () => {
        const configKey = serviceMap.getConfigKey("fake_service_name");
        expect(configKey).toEqual("message_service_fake_service_name");
      });
    });

    describe("#tryGetFunctionFromService", () => {
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

  describe("#getServiceMetadata", () => {
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
      const oldProcessEnv = process.env;
      beforeEach(async () => {
        process.env.TWILIO_MULTI_ORG = false;
      });
      afterEach(async () => {
        process.env = oldProcessEnv;
      });
      it("returns the metadata", () => {
        const metadata = serviceMap.getServiceMetadata("twilio");
        expect(metadata).toEqual({
          name: "twilio",
          supportsCampaignConfig: false,
          supportsOrgConfig: false,
          type: "SMS"
        });
      });
      describe("when TWILIO_MULTI_ORG is true", () => {
        beforeEach(async () => {
          process.env.TWILIO_MULTI_ORG = true;
        });
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

  describe("#getMessageServiceConfig", () => {
    let fakeGetServiceConfig;
    let fakeOrganization;
    let fakeOptions;
    let fakeConfig;
    let expectedGetConfigOptions;
    beforeEach(async () => {
      fakeOrganization = { id: 1 };
      fakeConfig = { fake_one: "fake1", fake_two: "fake2" };
      fakeOptions = { fake_option: "fakeOpt" };
      expectedGetConfigOptions = { onlyLocal: undefined };
      fakeGetServiceConfig = jest.fn();
      jest
        .spyOn(serviceMap, "tryGetFunctionFromService")
        .mockReturnValue(fakeGetServiceConfig);
      jest.spyOn(serviceMap, "getConfigKey");
      jest.spyOn(config, "getConfig").mockReturnValue(fakeConfig);
    });
    it("calls the functions", async () => {
      await serviceMap.getMessageServiceConfig(
        "fake_fake_service",
        fakeOrganization,
        fakeOptions
      );
      expect(serviceMap.tryGetFunctionFromService.mock.calls).toEqual([
        ["fake_fake_service", "getServiceConfig"]
      ]);
      expect(serviceMap.getConfigKey.mock.calls).toEqual([
        ["fake_fake_service"]
      ]);
      expect(config.getConfig.mock.calls).toEqual([
        [
          "message_service_fake_fake_service",
          fakeOrganization,
          expectedGetConfigOptions
        ]
      ]);
      expect(fakeGetServiceConfig.mock.calls).toEqual([
        [fakeConfig, fakeOrganization, fakeOptions]
      ]);
    });

    describe("when restrctToOrgFeatures is truthy", () => {
      beforeEach(async () => {
        fakeOptions = { restrictToOrgFeatures: true };
        expectedGetConfigOptions = { onlyLocal: true };
      });
      it("passes onlyLocal to getConfig", async () => {
        await serviceMap.getMessageServiceConfig(
          "fake_fake_service",
          fakeOrganization,
          fakeOptions
        );
        expect(config.getConfig.mock.calls).toEqual([
          [
            "message_service_fake_fake_service",
            fakeOrganization,
            expectedGetConfigOptions
          ]
        ]);
      });
    });

    describe("when the services doesn't support configuration", () => {
      beforeEach(async () => {
        jest
          .spyOn(serviceMap, "tryGetFunctionFromService")
          .mockReturnValue(undefined);
      });
      it("returns null", async () => {
        const returned = await serviceMap.getMessageServiceConfig(
          "fake_fake_service",
          fakeOrganization,
          fakeOptions
        );
        expect(returned).toEqual(null);
        expect(serviceMap.getConfigKey).not.toHaveBeenCalled();
        expect(config.getConfig).not.toHaveBeenCalled();
        expect(fakeGetServiceConfig).not.toHaveBeenCalled();
      });
    });
  });
});
