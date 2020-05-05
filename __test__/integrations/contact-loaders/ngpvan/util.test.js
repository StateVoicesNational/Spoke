import each from "jest-each";
import Van, {
  DEFAULT_NGP_VAN_API_BASE_URL
} from "../../../../src/integrations/contact-loaders/ngpvan/util";

const config = require("../../../../src/server/api/lib/config");

describe("ngpvan/util", () => {
  let organization;

  beforeEach(async () => {
    organization = {
      id: 77,
      name: "What good shall I do today?"
    };
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe(".makeUrl", () => {
    let oldNgpVanApiBaseUrl;
    let path;
    let expectedUrl;
    beforeEach(async () => {
      oldNgpVanApiBaseUrl = process.env.NGP_VAN_API_BASE_URL;
      process.env.NGP_VAN_API_BASE_URL = "https://relisten.net";
      path = "grateful-dead/1973/02/28/hes-gone?source=90046";
    });

    beforeEach(async () => {
      jest.spyOn(config, "getConfig");
    });

    beforeEach(async () => {
      expectedUrl = `${process.env.NGP_VAN_API_BASE_URL}/${path}`;
    });

    afterEach(async () => {
      process.env.NGP_VAN_API_BASE_URL = oldNgpVanApiBaseUrl;
    });

    it("makes a URL with base url from the environment", async () => {
      expect(Van.makeUrl(path, organization)).toEqual(expectedUrl);
      expect(config.getConfig.mock.calls).toEqual([
        ["NGP_VAN_API_BASE_URL", organization]
      ]);
    });

    describe("when NGP_VAN_API_BASE_URL is not set in the environment", () => {
      beforeEach(async () => {
        delete process.env.NGP_VAN_API_BASE_URL;
      });

      beforeEach(async () => {
        expectedUrl = `${DEFAULT_NGP_VAN_API_BASE_URL}/${path}`;
      });

      it("makes a URL with the default base url", async () => {
        expect(Van.makeUrl(path, organization)).toEqual(expectedUrl);
      });
    });
  });

  describe(".getAuth", () => {
    let oldNgpVanAppName;
    let oldNgpVanApiKey;
    beforeAll(async () => {
      oldNgpVanAppName = process.env.NGP_VAN_APP_NAME;
      oldNgpVanApiKey = process.env.NGP_VAN_API_KEY;
    });

    afterAll(async () => {
      process.env.NGP_VAN_APP_NAME = oldNgpVanAppName;
      process.env.NGP_VAN_API_KEY = oldNgpVanApiKey;
    });

    beforeEach(async () => {
      jest.spyOn(config, "getConfig");
    });

    const successValidator = (auth, error) => {
      expect(auth).toMatch(/^Basic [A-Za-z0-9+/=]|=[^=]|={3,}$/);
      expect(error).toBeUndefined();
    };

    const failureValidator = (auth, error) => {
      expect(error).toEqual(
        new Error("Environment missing NGP_VAN_APP_NAME or NGP_VAN_API_KEY")
      );

      expect(auth).not.toEqual(expect.anything());
    };

    each([
      ["both are defined", "spoke", "topsecret", successValidator],
      ["NGP_VAN_API_KEY is not defined", "spoke", undefined, failureValidator],
      [
        "NGP_VAN_APP_NAME is not defined",
        undefined,
        "topsecret",
        failureValidator
      ],
      ["both are not defined", undefined, undefined, failureValidator]
    ]).test("%s", async (description, appName, apiKey, validator) => {
      let auth;
      let error;

      if (appName) {
        process.env.NGP_VAN_APP_NAME = appName;
      } else {
        delete process.env.NGP_VAN_APP_NAME;
      }

      if (apiKey) {
        process.env.NGP_VAN_API_KEY = apiKey;
      } else {
        delete process.env.NGP_VAN_API_KEY;
      }

      try {
        auth = Van.getAuth(organization);
      } catch (caughtException) {
        error = caughtException;
      } finally {
        expect(config.getConfig.mock.calls).toEqual([
          ["NGP_VAN_APP_NAME", organization],
          ["NGP_VAN_API_KEY", organization]
        ]);
        validator(auth, error);
      }
    });
  });
});
