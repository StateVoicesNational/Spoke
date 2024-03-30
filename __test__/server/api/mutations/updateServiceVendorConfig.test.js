import { updateServiceVendorConfigGql } from "../../../../src/containers/Settings";
// import * as messagingServices from "../../../../src/extensions/service-vendors";
import * as serviceMap from "../../../../src/extensions/service-vendors/service_map";
import * as twilio from "../../../../src/extensions/service-vendors/twilio";
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

describe("updateServiceVendorConfig", () => {
  beforeEach(async () => {
    await setupTest();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);
  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.FLUSHDB();
    jest.restoreAllMocks();
  });

  let user;
  let organization;
  let vars;
  let newConfig;
  let expectedConfig;
  let expectedCacheConfig;
  beforeEach(async () => {
    user = await createUser();
    const invite = await createInvite();
    const createOrganizationResult = await createOrganization(user, invite);
    organization = createOrganizationResult.data.createOrganization;
    await ensureOrganizationTwilioWithMessagingService(
      createOrganizationResult
    );

    newConfig = {
      twilioAccountSid: "fake_account_sid",
      twilioMessageServiceSid: "fake_message_service_sid"
    };

    expectedConfig = {
      TWILIO_ACCOUNT_SID: "fake_account_sid",
      TWILIO_MESSAGE_SERVICE_SID: "fake_message_service_sid"
    };

    expectedCacheConfig = {
      accountSid: "fake_account_sid",
      messageServiceSid: "fake_message_service_sid"
    };

    jest.spyOn(twilio, "updateConfig");
    jest.spyOn(orgCache, "getMessageServiceConfig");
    jest.spyOn(orgCache, "clear");
    jest.spyOn(orgCache, "load");

    vars = {
      organizationId: organization.id,
      serviceName: "twilio",
      config: JSON.stringify(newConfig)
    };
  });

  describe("when it's not the configured message service name", () => {
    beforeEach(async () => {
      vars.serviceName = "this will never be a message service name";
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateServiceVendorConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual(
        "Can't configure this will never be a message service name. It's not the configured message service"
      );
      expect(twilio.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("when the organization has no features", () => {
    beforeEach(async () => {
      const dbOrganization = await Organization.get(organization.id);
      dbOrganization.features = null;
      await dbOrganization.save();
      if (r.redis) r.redis.FLUSHDB();
    });
    it("returns an error", async () => {
      const gqlResult = await runGql(updateServiceVendorConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual(
        "Can't configure twilio. It's not the configured message service"
      );
      expect(twilio.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("when it's not a valid message service", () => {
    beforeEach(async () => {
      jest.spyOn(serviceMap, "getService").mockReturnValue(null);
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateServiceVendorConfigGql, vars, user);
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
      const gqlResult = await runGql(updateServiceVendorConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual(
        "twilio does not support configuration"
      );
      expect(twilio.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("when the passed config is not valid JSON", () => {
    beforeEach(async () => {
      vars.config = "not JSON";
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateServiceVendorConfigGql, vars, user);
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
      const gqlResult = await runGql(updateServiceVendorConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual("OH NO!");
    });
  });

  describe("when the organization gets updated", () => {
    let configKey;
    let dbOrganization;
    let service;
    let sharedExpectations;
    let expectedFeatures;
    beforeEach(async () => {
      service = "twilio";
      configKey = serviceMap.getConfigKey("twilio");
      dbOrganization = await Organization.get(organization.id);
      dbOrganization.features = JSON.stringify({ service: "twilio" });
      await dbOrganization.save();
      if (r.redis) r.redis.FLUSHDB();

      expectedFeatures = {
        service,
        [configKey]: expectedConfig
      };

      sharedExpectations = async (gqlResult, features) => {
        expect(orgCache.getMessageServiceConfig.mock.calls).toEqual([
          [
            expect.objectContaining({
              id: 1
            }),
            expect.objectContaining({
              obscureSensitiveInformation: true
            })
          ]
        ]);
        expect(gqlResult.data.updateServiceVendorConfig.config).toEqual(
          expect.objectContaining(expectedCacheConfig)
        );

        dbOrganization = await Organization.get(organization.id);
        expect(JSON.parse(dbOrganization.features)).toEqual(features);

        expect(orgCache.clear.mock.calls).toEqual([[dbOrganization.id]]);
        expect(orgCache.load.mock.calls).toEqual([
          [organization.id],
          [dbOrganization.id]
        ]);
      };
    });
    describe("when features DOES NOT HAVE an existing config for the message service", () => {
      it("writes message service config in features.configKey no existing config", async () => {
        const gqlResult = await runGql(
          updateServiceVendorConfigGql,
          vars,
          user
        );
        expect(twilio.updateConfig.mock.calls[0].slice(0, 2)).toEqual([
          undefined,
          newConfig
        ]);
        expect(twilio.updateConfig.mock.calls[0][2].id).toEqual(
          Number(organization.id)
        );

        sharedExpectations(gqlResult, expectedFeatures);
      });
    });

    describe("when features DOES HAVE an existing config for the message service", () => {
      beforeEach(async () => {
        dbOrganization.features = JSON.stringify({
          service,
          [configKey]: "it doesn't matter"
        });
        await dbOrganization.save();
        if (r.redis) r.redis.FLUSHDB();
      });
      it("writes message service config in features.configKey", async () => {
        const gqlResult = await runGql(
          updateServiceVendorConfigGql,
          vars,
          user
        );
        expect(twilio.updateConfig.mock.calls[0].slice(0, 2)).toEqual([
          "it doesn't matter",
          newConfig
        ]);
        expect(twilio.updateConfig.mock.calls[0][2].id).toEqual(
          Number(organization.id)
        );

        sharedExpectations(gqlResult, expectedFeatures);
      });
    });

    describe("when updating legacy config (all config elements at the top level of organization.features)", () => {
      // for example, for twilio, this is when all the config elements are not children of
      // the `message_service_twilio` key in organization.features
      beforeEach(async () => {
        dbOrganization.features = JSON.stringify({
          service,
          TWILIO_ACCOUNT_SID: "the former_fake_account_sid",
          TWILIO_MESSAGE_SERVICE_SID: "the_former_fake_message_service_sid"
        });
        await dbOrganization.save();
        if (r.redis) r.redis.FLUSHDB();
      });
      it("writes individual config components to the top level of features", async () => {
        const gqlResult = await runGql(
          updateServiceVendorConfigGql,
          vars,
          user
        );
        expect(twilio.updateConfig.mock.calls[0].slice(0, 2)).toEqual([
          undefined,
          newConfig
        ]);
        expect(twilio.updateConfig.mock.calls[0][2].id).toEqual(
          Number(organization.id)
        );

        sharedExpectations(gqlResult, { service, ...expectedConfig });
      });
    });

    describe("when the message service is not twilio and the config was at the top level", () => {
      let extremelyFakeService;
      beforeEach(async () => {
        service = "extremely_fake_service";
        configKey = serviceMap.getConfigKey(service);
        vars.serviceName = service;
        dbOrganization.features = JSON.stringify({
          service,
          TWILIO_ACCOUNT_SID: "the former_fake_account_sid",
          TWILIO_MESSAGE_SERVICE_SID: "the_former_fake_message_service_sid"
        });
        await dbOrganization.save();
        if (r.redis) r.redis.FLUSHDB();

        extremelyFakeService = {
          updateConfig: jest.fn().mockImplementation(() => {
            return expectedConfig;
          })
        };
        jest
          .spyOn(serviceMap, "getService")
          .mockReturnValue(extremelyFakeService);
      });
      it("writes the message service config to features.config_key", async () => {
        await runGql(updateServiceVendorConfigGql, vars, user);
        dbOrganization = await Organization.get(organization.id);
        expect(JSON.parse(dbOrganization.features)).toEqual(
          expect.objectContaining({ [configKey]: expectedConfig })
        );
      });
    });
  });
});
