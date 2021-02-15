import * as serviceMap from "../../../src/extensions/messaging_services/service_map";

describe("service_map", () => {
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
        expect(error.message).toEqual("not_a_service is not a message service");
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
