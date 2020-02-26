import each from "jest-each";
import {
  getCellFromRow,
  getZipFromRow,
  rowTransformer
} from "../../../src/integrations/contact-loaders/ngpvan";
const ngpvan = require("../../../src/integrations/contact-loaders/ngpvan");

describe("ngpvan", () => {
  describe("rowTransformer", () => {
    let getCellFromRowSpy;
    let getZipFromRowSpy;
    beforeEach(() => {
      getCellFromRowSpy = jest
        .spyOn(ngpvan, "getCellFromRow")
        .mockReturnValue("12024561414");
      getZipFromRowSpy = jest
        .spyOn(ngpvan, "getZipFromRow")
        .mockReturnValue("07052");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("delegates to its dependencies", () => {
      const inputFields = ["VanID"];
      const expectedFields = ["cell", "zip", "external_id"];
      const inputRow = {
        VanID: "abc"
      };
      const transformedRow = rowTransformer(inputFields, inputRow);
      expect(getCellFromRowSpy.mock.calls).toEqual([[inputRow]]);
      expect(getZipFromRowSpy.mock.calls).toEqual([[inputRow]]);
      expect(transformedRow.row).toEqual({
        VanID: "abc",
        external_id: "abc",
        cell: "12024561414",
        zip: "07052"
      });
      expect(transformedRow.addedFields.length).toEqual(expectedFields.length);
      expect(transformedRow.addedFields).toEqual(
        expect.arrayContaining(expectedFields)
      );
    });
  });

  describe("getCellFromRow", () => {
    each([
      [{ CellPhone: "2024561111", CellPhoneDialingPrefix: "1" }, "12024561111"],
      [
        {
          CellPhone: "2024561111",
          CellPhoneDialingPrefix: "1",
          CellPhoneCountryCode: "US"
        },
        "12024561111"
      ],
      [
        {
          CellPhone: "2024561111",
          CellPhoneDialingPrefix: "1",
          CellPhoneCountryCode: "AU"
        },
        undefined
      ],
      [{ HomePhone: "2024561111", HomePhoneDialingPrefix: "1" }, undefined],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "1"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "0"
        },
        undefined
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "a"
        },
        undefined
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1"
        },
        undefined
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "1",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "0",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        undefined
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "a",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        undefined
      ],
      [
        {
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "1"
        },
        "12024561414"
      ],
      [
        {
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        undefined
      ],
      [
        {
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "a"
        },
        undefined
      ],
      [{ WorkPhone: "2024561414", WorkPhoneDialingPrefix: "1" }, undefined],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "0",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "1"
        },
        "12024561414"
      ]
    ]).test("getZipFromRow( %j ) returns %s", (row, allegedPhone) => {
      expect(getCellFromRow(row)).toEqual(allegedPhone);
    });
  });

  describe("getZipFromRow", () => {
    each([
      [{ Address: "350 Fifth Avenue, New York, NY 10118" }, "10118"],
      [{ Address: "350 Fifth Avenue, New York, NY 10118-1234" }, "10118-1234"],
      [{ Address: "350 Fifth Avenue, New York, NY" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 10118  " }, "10118"],
      [{ Address: "350 Fifth Avenue, New York, NY      10118  " }, "10118"],
      [{ Address: "350 Fifth Avenue, New York, NY10118  " }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 1011" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 1011-1234" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 10118-123" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 1AAAA" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 10118=1AAA" }, undefined]
    ]).test("getZipFromRow( %j ) returns %s", (allegedAddress, allegedZip) => {
      expect(getZipFromRow(allegedAddress)).toEqual(allegedZip);
    });
  });
});
