import { r } from "../../../../src/server/models";
import {
  cleanupTest,
  createInvite,
  createOrganization,
  createUser,
  runGql,
  setupTest,
  ensureOrganizationTwilioWithMessagingService
} from "../../../test_helpers";
import { updateMessageServiceConfigGql } from "../../../../src/containers/Settings";
import * as twilio from "../../../../src/extensions/messaging_services/twilio";
import * as messagingServices from "../../../../src/extensions/messaging_services";
import * as serviceMap from "../../../../src/extensions/messaging_services/service_map";

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
  beforeEach(async () => {
    user = await createUser();
    const invite = await createInvite();
    const createOrganizationResult = await createOrganization(user, invite);
    organization = createOrganizationResult.data.createOrganization;
    await ensureOrganizationTwilioWithMessagingService(
      createOrganizationResult
    );

    jest
      .spyOn(twilio, "updateConfig")
      .mockResolvedValue({ fake_config: "fake_config_value" });

    vars = {
      organizationId: organization.id,
      messageServiceName: "twilio",
      config: JSON.stringify({ fake_config: "fake_config_value" })
    };
  });

  it("delegates to message service's updateConfig", async () => {
    const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
    expect(gqlResult.data.updateMessageServiceConfig).toEqual({
      fake_config: "fake_config_value"
    });
    expect(twilio.updateConfig.mock.calls).toEqual([
      [expect.objectContaining({ id: 1 }), { fake_config: "fake_config_value" }]
    ]);
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
      jest.spyOn(messagingServices, "getService").mockReturnValue(null);
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

  describe("when the service config function throw an exception", () => {
    beforeEach(async () => {
      jest.spyOn(twilio, "updateConfig").mockImplementation(() => {
        throw new Error("OH NO!");
      });
    });

    it("returns an error", async () => {
      const gqlResult = await runGql(updateMessageServiceConfigGql, vars, user);
      expect(gqlResult.errors[0].message).toEqual(
        "Error updating config for twilio: Error: OH NO!"
      );
    });
  });
});
