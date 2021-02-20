import * as serviceMap from "../../../src/extensions/messaging_services/service_map";
import * as messagingServices from "../../../src/extensions/messaging_services/index";

describe("extensions/messaging_services index", () => {
  describe("fullyConfigured", () => {
    let fullyConfiguredFunction;
    let organization;
    beforeEach(async () => {
      organization = {
        feature: {
          service: "fake_fake_service"
        }
      };
      fullyConfiguredFunction = jest.fn().mockReturnValue(false);
      jest
        .spyOn(serviceMap, "tryGetFunctionFromService")
        .mockReturnValue(fullyConfiguredFunction);
    });
    it("calls functions and returns something", async () => {
      expect(await messagingServices.fullyConfigured(organization)).toEqual(
        false
      );
      expect(messagingServices.tryGetFunctionFromService.mock.calls).toEqual([
        ["fake_fake_service", "fullyConfigured"]
      ]);
    });
    describe("when the services doesn't have fullyConfigured", () => {
      beforeEach(async () => {
        jest
          .spyOn(serviceMap, "tryGetFunctionFromService")
          .mockReturnValue(null);
      });
      it("returns true", async () => {
        expect(await messagingServices.fullyConfigured(organization)).toEqual(
          true
        );
      });
    });
  });
});
