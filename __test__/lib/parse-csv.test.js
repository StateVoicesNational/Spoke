import { parseCSV } from "../../src/lib";

describe("parseCSV", () => {
  describe("with PHONE_NUMBER_COUNTRY set", () => {
    beforeEach(() => (process.env.PHONE_NUMBER_COUNTRY = "AU"));
    afterEach(() => delete process.env.PHONE_NUMBER_COUNTRY);

    it("should consider phone numbers from that country as valid", () => {
      const csv = "firstName,lastName,cell\ntest,test,61468511000";
      parseCSV(csv, [], ({ contacts, error }) => {
        expect(error).toBeFalsy();
        expect(contacts.length).toEqual(1);
      });
    });
  });

  describe("When required headers are snake case", () => {
    const mockCallback = jest.fn();
    const csv =
      "first_name,last_name,cell,zip\r\nJerome,Garcia,14155551212,94970\r\n";

    it("should call the callback with a contact with camel case fields", () => {
      parseCSV(csv, [], mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].contacts[0]).toEqual({
        cell: "+14155551212",
        firstName: "Jerome",
        lastName: "Garcia",
        zip: "94970"
      });
    });
  });
});
