import Papa from "papaparse";
import { parseCSV, organizationCustomFields } from "../../src/lib";

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

  describe("when a header transformer is provided", () => {
    let csv;

    beforeEach(async () => {
      csv =
        "first_name,last_name,cell,zip\r\nJerome,Garcia,14155551212,94970\r\n";
      jest.spyOn(Papa, "parse");
    });

    afterEach(async () => {
      jest.restoreAllMocks();
    });

    it("is passed to Papa.parse", async () => {
      parseCSV(csv, () => {}, { headerTransformer: () => {} });
      expect(Papa.parse).toHaveBeenCalledTimes(1);
      expect(Papa.parse.mock.calls[0][0]).toEqual(csv);
      expect(Papa.parse.mock.calls[0][1]).toHaveProperty("transformHeader");
    });

    describe("and when a header transformer is not provided", () => {
      it("does not pass a header transformer to Papa.parse", async () => {
        parseCSV(csv, () => {}, {});
        expect(Papa.parse).toHaveBeenCalledTimes(1);
        expect(Papa.parse.mock.calls[0][0]).toEqual(csv);
        expect(Papa.parse.mock.calls[0][1]).not.toHaveProperty(
          "transformHeader"
        );
      });
    });
  });

  describe("When a rowTransformer is provided", () => {
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
      .mockReturnValue({ rows: [], fields: [] })
      .mockReturnValueOnce({ row: mockContacts[0], addedFields: [] })
      .mockReturnValueOnce({ row: mockContacts[1], addedFields: [] });

    const csv = `${Object.keys(contacts[0]).join(",")}\r\n${Object.values(
      contacts[0]
    ).join(",")}\r\n${Object.values(contacts[1]).join(",")}`;

    it("it calls the rowTransformer for each row and returns the transformed data", () => {
      parseCSV(csv, mockCallback, {
        rowTransformer: mockRowTransformer
      });

      expect(mockRowTransformer).toHaveBeenCalledTimes(2);
      expect(mockRowTransformer.mock.calls[0][0]).toEqual(
        expect.arrayContaining(Object.keys(contacts[0]))
      );
      expect(mockRowTransformer.mock.calls[0][1]).toEqual(contacts[0]);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].contacts[0]).toEqual({
        cell: "+12024561111",
        first_name: "Aaa",
        last_name: "Bbb",
        zip: "20500",
        custom_fields: "{}",
        external_id: ""
      });
      expect(mockCallback.mock.calls[0][0].contacts[1]).toEqual({
        cell: "+12024561414",
        first_name: "Ccc",
        last_name: "Ddd",
        zip: "20501",
        custom_fields: "{}",
        external_id: ""
      });
    });
  });

  describe("#organizationCustomFields", () => {
    let contacts = [];
    let customFields = [];
    let expected = [];

    beforeEach(async () => {
      contacts = [
        {
          CanvassFileRequestID: "1286",
          VanID: "20700354",
          Address: "241 Ozno Sq, Pomizivi, TN 13358",
          firstName: "Marion",
          lastName: "Cook",
          StreetAddress: "241 Ozno Sq",
          City: "Pomizivi",
          State: "TN",
          ZipOrPostal: "",
          County: "Suffolk",
          Employer: "",
          Occupation: "",
          Email: "",
          HomePhone: "",
          IsHomePhoneACellExchange: "",
          CellPhone: "(831) 401-6718",
          WorkPhone: "",
          IsWorkPhoneACellExchange: "",
          Phone: "(670) 427-8081",
          OptInPhone: "",
          OptInStatus: "",
          OptInPhoneType: "",
          CongressionalDistrict: "",
          StateHouse: "004",
          StateSenate: "002",
          Party: "R",
          PollingLocation: "",
          PollingAddress: "",
          PollingCity: "",
          cell: "+18314016718",
          zip: "13358",
          external_id: "20700354"
        },
        {
          CanvassFileRequestID: "1286",
          VanID: "21681436",
          Address: "902 Hamze Pl, Biuhke, SC 35341",
          firstName: "Bill",
          lastName: "Fiore",
          StreetAddress: "902 Hamze Pl",
          City: "Biuhke",
          State: "SC",
          ZipOrPostal: "",
          County: "",
          Employer: "",
          Occupation: "",
          Email: "",
          HomePhone: "",
          IsHomePhoneACellExchange: "",
          CellPhone: "(802) 897-2566",
          WorkPhone: "",
          IsWorkPhoneACellExchange: "",
          Phone: "(332) 794-5172",
          OptInPhone: "",
          OptInStatus: "",
          OptInPhoneType: "",
          CongressionalDistrict: "001",
          StateHouse: "004",
          StateSenate: "002",
          Party: "R",
          PollingLocation: "",
          PollingAddress: "",
          PollingCity: "",
          cell: "+18028972566",
          zip: "35341",
          external_id: "21681436"
        }
      ];

      customFields = [
        ...new Set([...Object.keys(contacts[0]), ...Object.keys(contacts[1])])
      ];

      expected = [
        {
          cell: "+18314016718",
          custom_fields: JSON.stringify({
            CanvassFileRequestID: "1286",
            VanID: "20700354",
            Address: "241 Ozno Sq, Pomizivi, TN 13358",
            firstName: "Marion",
            lastName: "Cook",
            StreetAddress: "241 Ozno Sq",
            City: "Pomizivi",
            State: "TN",
            ZipOrPostal: "",
            County: "Suffolk",
            Employer: "",
            Occupation: "",
            Email: "",
            HomePhone: "",
            IsHomePhoneACellExchange: "",
            CellPhone: "(831) 401-6718",
            WorkPhone: "",
            IsWorkPhoneACellExchange: "",
            Phone: "(670) 427-8081",
            OptInPhone: "",
            OptInStatus: "",
            OptInPhoneType: "",
            CongressionalDistrict: "",
            StateHouse: "004",
            StateSenate: "002",
            Party: "R",
            PollingLocation: "",
            PollingAddress: "",
            PollingCity: "",
            cell: "+18314016718",
            zip: "13358",
            external_id: "20700354"
          }),
          external_id: "20700354",
          first_name: "Marion",
          last_name: "Cook",
          zip: "13358"
        },
        {
          cell: "+18028972566",
          custom_fields: JSON.stringify({
            CanvassFileRequestID: "1286",
            VanID: "21681436",
            Address: "902 Hamze Pl, Biuhke, SC 35341",
            firstName: "Bill",
            lastName: "Fiore",
            StreetAddress: "902 Hamze Pl",
            City: "Biuhke",
            State: "SC",
            ZipOrPostal: "",
            County: "",
            Employer: "",
            Occupation: "",
            Email: "",
            HomePhone: "",
            IsHomePhoneACellExchange: "",
            CellPhone: "(802) 897-2566",
            WorkPhone: "",
            IsWorkPhoneACellExchange: "",
            Phone: "(332) 794-5172",
            OptInPhone: "",
            OptInStatus: "",
            OptInPhoneType: "",
            CongressionalDistrict: "001",
            StateHouse: "004",
            StateSenate: "002",
            Party: "R",
            PollingLocation: "",
            PollingAddress: "",
            PollingCity: "",
            cell: "+18028972566",
            zip: "35341",
            external_id: "21681436"
          }),
          external_id: "21681436",
          first_name: "Bill",
          last_name: "Fiore",
          zip: "35341"
        }
      ];
    });

    it("returns a contact with a key for each required field and a custom_fields key containing an object with all the custom fields", async () => {
      const contactsWithCustomFields = organizationCustomFields(
        contacts,
        customFields
      );
      expect(contactsWithCustomFields).toEqual(expected);
    });

    describe("when there are no custom fields", () => {
      beforeEach(async () => {
        customFields = [];
        expected = [
          {
            cell: "+18314016718",
            custom_fields: JSON.stringify({}),
            external_id: "20700354",
            first_name: "Marion",
            last_name: "Cook",
            zip: "13358"
          },
          {
            cell: "+18028972566",
            custom_fields: JSON.stringify({}),
            external_id: "21681436",
            first_name: "Bill",
            last_name: "Fiore",
            zip: "35341"
          }
        ];
      });

      it("includes only required fields", async () => {
        const contactsWithoutCustomFields = organizationCustomFields(
          contacts,
          customFields
        );
        expect(contactsWithoutCustomFields).toEqual(expected);
      });
    });

    describe("when there are no contcts", () => {
      beforeEach(async () => {
        customFields = [];
        contacts = [];
        expected = [];
      });

      it("returns an empty array", async () => {
        const contactsWithoutCustomFields = organizationCustomFields(
          contacts,
          customFields
        );
        expect(contactsWithoutCustomFields).toEqual(expected);
      });
    });
  });
});
