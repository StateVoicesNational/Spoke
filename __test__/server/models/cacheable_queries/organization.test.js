import orgCache from "../../../../src/server/models/cacheable_queries/organization";
import * as serviceMap from "../../../../src/extensions/messaging_services/service_map";

describe("cacheable_queries.organization", () => {
  let serviceWith;
  let serviceWithout;
  let fakeServiceMap;
  let organizationWith;
  let organizationWithConfig;
  let organizationWithout;
  beforeEach(async () => {
    serviceWith = {
      getServiceConfig: jest.fn().mockImplementation(() => "fake_config"),
      getMessageServiceSid: jest
        .fn()
        .mockImplementation(() => "fake_message_service_sid")
    };

    serviceWithout = {};

    fakeServiceMap = { serviceWith, serviceWithout };

    organizationWith = { features: { service: "serviceWith" } };
    organizationWithConfig = {
      features: {
        service: "serviceWith",
        message_service_serviceWith: {
          fake_key: "fake_value"
        }
      }
    };
    organizationWithout = { features: { service: "serviceWithout" } };

    jest
      .spyOn(serviceMap, "getService")
      .mockImplementation(serviceName => fakeServiceMap[serviceName]);

    jest.spyOn(serviceMap, "getConfigKey");
    jest.spyOn(serviceMap, "tryGetFunctionFromService");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe("getMessageServiceConfig", () => {
    describe("when the message service has getMessageServiceConfig", () => {
      it("delegates to its dependencies and returns a config", async () => {
        const allegedConfig = await orgCache.getMessageServiceConfig(
          organizationWith
        );
        expect(allegedConfig).toEqual("fake_config");
        expect(serviceMap.tryGetFunctionFromService.mock.calls).toEqual([
          ["serviceWith", "getServiceConfig"]
        ]);
        expect(serviceMap.getConfigKey.mock.calls).toEqual([["serviceWith"]]);
        expect(serviceWith.getServiceConfig.mock.calls).toEqual([
          [
            undefined,
            organizationWith,
            {
              obscureSensitiveInformation: undefined,
              restirctToOrgFeatures: undefined
            }
          ]
        ]);
      });
      describe("when an organization has a config", () => {
        it("delegates to its dependencies and returns a config", async () => {
          const allegedConfig = await orgCache.getMessageServiceConfig(
            organizationWithConfig
          );
          expect(allegedConfig).toEqual("fake_config");
          expect(serviceMap.tryGetFunctionFromService.mock.calls).toEqual([
            ["serviceWith", "getServiceConfig"]
          ]);
          expect(serviceMap.getConfigKey.mock.calls).toEqual([["serviceWith"]]);
          expect(serviceWith.getServiceConfig.mock.calls).toEqual([
            [
              organizationWithConfig.features.message_service_serviceWith,
              organizationWithConfig,
              {
                restirctToOrgFeatures: undefined,
                obscureSensitiveInformation: undefined
              }
            ]
          ]);
        });
      });
    });
    describe("when the message service doesn't have getMessageServiceConfig", () => {
      it("delegates to its dependencies and doesn't return a config", async () => {
        const allegedConfig = await orgCache.getMessageServiceConfig(
          organizationWithout
        );
        expect(allegedConfig).toBeNull();
        expect(serviceMap.tryGetFunctionFromService.mock.calls).toEqual([
          ["serviceWithout", "getServiceConfig"]
        ]);
        expect(serviceMap.getConfigKey).not.toHaveBeenCalled();
        expect(serviceWith.getServiceConfig).not.toHaveBeenCalled();
      });
    });
  });

  describe("getMessageServiceSid", () => {
    describe("when the message service has getMessageServiceSid", () => {
      it("delegates to its dependencies and returns a config", async () => {
        const allegedSid = await orgCache.getMessageServiceSid(
          organizationWith
        );
        expect(allegedSid).toEqual("fake_message_service_sid");
        expect(serviceMap.tryGetFunctionFromService.mock.calls).toEqual([
          ["serviceWith", "getMessageServiceSid"]
        ]);
        expect(serviceWith.getMessageServiceSid.mock.calls).toEqual([
          [organizationWith, undefined, undefined]
        ]);
      });
    });
    describe("when the message service doesn't have getMessageServiceConfig", () => {
      it("delegates to its dependencies and doesn't return a config", async () => {
        const allegedSid = await orgCache.getMessageServiceSid(
          organizationWithout
        );
        expect(allegedSid).toBeNull();
        expect(serviceMap.tryGetFunctionFromService.mock.calls).toEqual([
          ["serviceWithout", "getMessageServiceSid"]
        ]);
        expect(serviceWith.getMessageServiceSid).not.toHaveBeenCalled();
      });
    });
  });
});
