import { parseCSV } from "../../src/lib";

describe("parseCSV", () => {
  describe("with PHONE_NUMBER_COUNTRY set", () => {
    beforeEach(() => (process.env.PHONE_NUMBER_COUNTRY = "AU"));
    afterEach(() => delete process.env.PHONE_NUMBER_COUNTRY);

    it("considers phone numbers from that country as valid", () => {
      const csv = "firstName,lastName,cell\ntest,test,61468511000";
      parseCSV(csv, ({ contacts, customFields, validationStats, error }) => {
        expect(error).toBeFalsy();
        expect(contacts.length).toEqual(1);
      });
    });
  });

  describe("When required headers are snake case", () => {
    const mockCallback = jest.fn();
    const csv =
      "first_name,last_name,cell,zip\r\nJerome,Garcia,14155551212,94970\r\n";

    it("calls the callback with a contact with camel case fields", () => {
      parseCSV(csv, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].contacts[0]).toEqual({
        cell: "+14155551212",
        firstName: "Jerome",
        lastName: "Garcia",
        zip: "94970"
      });
    });
  });

  describe("When required headers are CamelCaps", () => {
    const mockCallback = jest.fn();
    const csv =
      "FirstName,LastName,cell,zip\r\nJerome,Garcia,14155551212,94970\r\n";

    it("calls the callback with a contact with camel case fields", () => {
      parseCSV(csv, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].contacts[0]).toEqual({
        cell: "+14155551212",
        firstName: "Jerome",
        lastName: "Garcia",
        zip: "94970"
      });
    });
  });

  describe('When a rowTransformer is provided', () => {
    const mockCallback = jest.fn();

    const mockContacts = [
      {
        cell: "12024561111",
        firstName: "Aaa",
        lastName: "Bbb",
        zip: "20500"
      },
      {
        cell: "12024561414",
        firstName: "Ccc",
        lastName: "Ddd",
        zip: "20501"
      }
    ];

    const contacts = [
      {
        cell: "12024561110",
        firstName: "Www",
        lastName: "Xxx",
        zip: "10500"
      },
      {
        cell: "12024561410",
        firstName: "Yyy",
        lastName: "Zzz",
        zip: "10501"
      }
    ];

    const mockRowTransformer = jest
      .fn()
      .mockReturnValue({ rows: [], fields: []})
      .mockReturnValueOnce({ row: mockContacts[0], addedFields: [] })
      .mockReturnValueOnce({ row: mockContacts[1], addedFields: [] });

    const csv =
      `${Object.keys(contacts[0]).join(',')}\r\n${Object.values(contacts[0]).join(',')}\r\n${Object.values(contacts[1]).join(',')}`;

    it("it calls the rowTransformer for each row and returns the transformed data", () => {
      parseCSV(csv, mockCallback, mockRowTransformer);

      expect(mockRowTransformer).toHaveBeenCalledTimes(2);
      expect(mockRowTransformer.mock.calls[0][0]).toEqual(expect.arrayContaining(Object.keys(contacts[0])));
      expect(mockRowTransformer.mock.calls[0][1]).toEqual(contacts[0]);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].contacts[0]).toEqual({
        cell: "+12024561111",
        firstName: "Aaa",
        lastName: "Bbb",
        zip: "20500"
      });
      expect(mockCallback.mock.calls[0][0].contacts[1]).toEqual({
        cell: "+12024561414",
        firstName: "Ccc",
        lastName: "Ddd",
        zip: "20501"
      });
    });
  });
});
