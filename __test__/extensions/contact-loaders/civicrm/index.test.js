import * as LoaderToTest from "../../../../src/extensions/contact-loaders/civicrm";

describe("civicrm contact loader", () => {
  beforeEach(async () => {});

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("comes with standard contact loader functionality", async () => {
    // Most action handlers in Spoke have test handlers which are as simple as calling
    // the validateActionHandler function. The validateActionHandler function is basically
    // "Does the handler have this function?" A lot of these tests are doing the same thing.

    expect(LoaderToTest.name).toEqual("civicrm");
    expect(LoaderToTest.displayName()).toEqual("CiviCRM");
    expect(LoaderToTest.clientChoiceDataCacheKey({ id: 1 }, null)).toEqual("1");
    expect(
      await LoaderToTest.getClientChoiceData({ id: 1 }, null, null)
    ).toEqual({
      data: "{}",
      expiresSeconds: 3600
    });
    expect(typeof LoaderToTest.addServerEndpoints).toEqual("function");
    expect(typeof LoaderToTest.available).toEqual("function");
    expect(typeof LoaderToTest.processContactLoad).toEqual("function");
  });
});
