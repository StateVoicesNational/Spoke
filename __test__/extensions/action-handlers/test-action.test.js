import { validateActionHandler } from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/test-action";

describe("test-action", () => {
  it("passes validation", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
  });
});
