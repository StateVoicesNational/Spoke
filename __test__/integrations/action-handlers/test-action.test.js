import { validateActionHandler } from "../../../src/integrations/action-handlers";

import * as HandlerToTest from "../../../src/integrations/action-handlers/test-action";

describe("test-action", () => {
  it("passes validation", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
  });
});
