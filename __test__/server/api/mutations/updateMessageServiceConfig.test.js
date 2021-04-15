import { updateMessageServiceConfigGql } from "../../../../src/containers/Settings";
// import * as messagingServices from "../../../../src/extensions/messaging_services";
import * as serviceMap from "../../../../src/extensions/messaging_services/service_map";
import * as twilio from "../../../../src/extensions/messaging_services/twilio";
import { r, Organization } from "../../../../src/server/models";
import orgCache from "../../../../src/server/models/cacheable_queries/organization";
import {
  cleanupTest,
  createInvite,
  createOrganization,
  createUser,
  ensureOrganizationTwilioWithMessagingService,
  runGql,
  setupTest
} from "../../../test_helpers";

describe("updateMessageServiceConfig", () => {
  beforeEach(async () => {
    await setupTest();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);
  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
    jest.restoreAllMocks();
  });

  let user;
  let organization;
  let vars;
  let newConfig;
  beforeEach(async () => {
    user = await createUser();
    const invite = await createInvite();
    const createOrganizationResult = await createOrganization(user, invite);
    organization = createOrganizationResult.data.createOrganization;
    await ensureOrganizationTwilioWithMessagingService(
      createOrganizationResult
    );

    newConfig = { fake_config: "fake_config_value" };
    jest.spyOn(twilio, "updateConfig").mockResolvedValue(newConfig);

    jest
      .spyOn(orgCache, "getMessageServiceConfig")
      .mockResolvedValue(newConfig);

    vars = {
      organizationId: organization.id,
      messageServiceName: "twilio",
      config: JSON.stringify(newConfig)
    };
  });

  describe("when there is no message service-specific section in features", () => {
    it("calls message service's updateConfig and other functions", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(twilio.updateConfig.mock.calls).toEqual([[undefined, newConfig]]);
      expect(orgCache.getMessageServiceConfig.mock.calls).toEqual([
        [
          expect.objectContaining({
            id: 1,
            feature: expect.objectContaining({
              ...newConfig
              // message_service_twilio: newConfig
            })
          })
        ]
      ]);
      expect(gqlResult.data.updateMessageServiceConfig).toEqual(newConfig);

      // TODO
      // expect cache.clear to have been called
      // expect cache.load to have been called
    });
  });

  it("updates the config in organization.features", async () => {
    // TODO
  });

  describe("when it's not the configured message service name", () => {
    beforeEach(async () => {
      vars.messageServiceName = "this will never be a message service name";
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual(
        "Can't configure this will never be a message service name. It's not the configured message service"
      );
      expect(twilio.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("when it's not a valid message service", () => {
    beforeEach(async () => {
      jest.spyOn(serviceMap, "getService").mockReturnValue(null);
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual(
        "twilio is not a valid message service"
      );
      expect(twilio.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("when the service is not configurable", () => {
    beforeEach(async () => {
      jest.spyOn(serviceMap, "tryGetFunctionFromService").mockReturnValue(null);
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual(
        "twilio does not support configuration"
      );
      expect(twilio.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("when the pass config is not valid JSON", () => {
    beforeEach(async () => {
      vars.config = "not JSON";
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual("Config is not valid JSON");
      expect(twilio.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("when the service config function throws an exception", () => {
    beforeEach(async () => {
      jest.spyOn(twilio, "updateConfig").mockImplementation(() => {
        throw new Error("OH NO!");
      });
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual("OH NO!");
    });
  });

  describe("when there is an existing config", () => {
    let fakeExistingConfig;
    beforeEach(async () => {
      const configKey = serviceMap.getConfigKey("twilio");
      fakeExistingConfig = {
        fake_existing_config_key: "fake_existing_config_value"
      };
      const dbOrganization = await Organization.get(organization.id);
      const newFeatures = JSON.stringify({
        ...JSON.parse(dbOrganization.features),
        [configKey]: fakeExistingConfig
      });
      dbOrganization.features = newFeatures;
      await dbOrganization.save();
      await orgCache.clear(organization.id);
    });
    it("passes it to updateConfig", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(twilio.updateConfig.mock.calls).toEqual([
        [fakeExistingConfig, newConfig]
      ]);
      expect(orgCache.getMessageServiceConfig.mock.calls).toEqual([
        [
          expect.objectContaining({
            id: 1,
            feature: expect.objectContaining({
              message_service_twilio: newConfig
            })
          })
        ]
      ]);
      expect(gqlResult.data.updateMessageServiceConfig).toEqual(newConfig);
    });
  });

  describe("when the organization had no features", () => {
    it("does not throw an exception", async () => {
      // TODO
    });
  });

  describe("when updating legacy config (all config elements at the top level of organization.features)", () => {
    // for example, for twilio, this is when all the config elements are not children of
    // the `message_service_twilio` key in organization.features
    it("updates the config at the top level", async () => {});
  });
});
