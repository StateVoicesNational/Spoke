import { getProcessEnvDstReferenceTimezone } from "../../src/lib/tz-helpers";

describe("test getProcessEnvDstReferenceTimezone", () => {
  it("works", () => {
    expect(getProcessEnvDstReferenceTimezone()).toEqual("US/Eastern");
  });
});
