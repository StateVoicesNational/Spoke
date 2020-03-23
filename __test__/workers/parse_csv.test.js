import { parseCSVAsync } from "../../src/workers/parse_csv";

describe("#parseCSVAsync", () => {
  let csv;

  beforeEach(async () => {
    csv = "firstName,lastName,cell,zip\r\nJerome,Garcia,14155551212,94970";
  });

  it("returns a promise", async () => {
    const parsed = await parseCSVAsync(csv);

    expect(parsed.contacts).toHaveLength(1);
    expect(parsed.contacts[0]).toEqual({
      cell: "+14155551212",
      first_name: "Jerome",
      last_name: "Garcia",
      zip: "94970",
      custom_fields: "{}",
      external_id: ""
    });
    expect(parsed.customFields).toEqual([]);
    expect(parsed.validationStats).toEqual({
      dupeCount: 0,
      invalidCellCount: 0,
      missingCellCount: 0,
      zipCount: 1
    });
  });

  describe("when there is an error", () => {
    beforeEach(async () => {
      csv =
        "givenName,surName,mobile,postal\r\nJerome,Garcia,14155551212,94970";
    });

    it("throws an exception", async done => {
      try {
        await parseCSVAsync(csv);
      } catch (error) {
        expect(error).toEqual("Missing fields: firstName, lastName, cell");
        return done();
      }
      return done("didn't raise an error"); // this will cause the test to fail
    });
  });
});
