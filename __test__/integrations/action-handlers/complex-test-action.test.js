import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/integrations/action-handlers";

import * as HandlerToTest from "../../../src/integrations/action-handlers/complex-test-action";

describe("test-action", () => {
  it("passes validation", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
  });
});
