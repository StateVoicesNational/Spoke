import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-sendemail";

describe("test-action-civicrm-sendemail", () => {
  it("passes validation", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
  });
});
