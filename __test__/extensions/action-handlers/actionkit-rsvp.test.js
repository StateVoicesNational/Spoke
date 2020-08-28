import { validateActionHandler } from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/actionkit-rsvp";

describe("test-action", () => {
  it("passes validation", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
  });
});
