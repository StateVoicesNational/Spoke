import { searchFor } from "../../src/lib/search-helpers";

const objects = [
  {
    field1: "red",
    field2: { inner: "purple" }
  },
  {
    field1: "blue",
    field2: { inner: "yellow" }
  },
  {
    field1: "green",
    field2: { inner: " blue " }
  }
];

describe("searchFor", () => {
  test("returns correct object based on one property", () => {
    const result = searchFor("blue", objects, ["field1"]);
    expect(result).toEqual([{ field1: "blue", field2: { inner: "yellow" } }]);
  });

  test("returns correct objects based on different (nested) properties", () => {
    const result = searchFor("blue", objects, ["field1", "field2.inner"]);
    expect(result).toEqual([
      {
        field1: "blue",
        field2: { inner: "yellow" }
      },
      {
        field1: "green",
        field2: { inner: " blue " }
      }
    ]);
  });
});
